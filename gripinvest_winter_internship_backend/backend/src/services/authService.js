const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { databaseConfig } = require("../config/database");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_DURATIONS,
  VALIDATION_RULES,
} = require("../utils/constants");
const {
  ApiResponse,
  AuthHelper,
  ValidationHelper,
  FormatHelper,
} = require("../utils/helpers");

/**
 * Authentication Service Class
 * Handles all authentication-related business logic
 */
class AuthService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
  }

  /**
   * Create email transporter for sending emails
   * @returns {Object} Nodemailer transporter
   */
  createEmailTransporter() {
    if (!process.env.SMTP_HOST) {
      console.warn(
        "Email configuration not found. Email features will be disabled."
      );
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<ApiResponse>} Registration result
   */
  async registerUser(userData) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        riskAppetite,
      } = userData;

      // Validate input data
      const emailValidation = ValidationHelper.validateEmail(email);
      if (!emailValidation.isValid) {
        return ApiResponse.error(
          emailValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const passwordValidation = ValidationHelper.validatePassword(password);
      if (!passwordValidation.isValid) {
        return ApiResponse.error(
          passwordValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const nameValidation = ValidationHelper.validateName(
        firstName,
        "First name"
      );
      if (!nameValidation.isValid) {
        return ApiResponse.error(
          nameValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check if user already exists
      const existingUserQuery = "SELECT id, email FROM users WHERE email = ?";
      const existingUsers = await databaseConfig.executeQuery(
        existingUserQuery,
        [email.toLowerCase()]
      );

      if (existingUsers.length > 0) {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_ALREADY_EXISTS,
          HTTP_STATUS.CONFLICT
        );
      }

      // Hash password
      const passwordHash = await AuthHelper.hashPassword(password);

      // Generate user ID
      const userId = FormatHelper.generateUUID();

      // Generate email verification token
      const emailVerificationToken = AuthHelper.generateRandomToken();

      // Create user
      const createUserQuery = `
        INSERT INTO users (
          id, first_name, last_name, email, password_hash, 
          phone, date_of_birth, risk_appetite, email_verified,
          account_balance, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, 50000.00, TRUE, NOW())
      `;

      const userParams = [
        userId,
        FormatHelper.sanitizeInput(firstName),
        FormatHelper.sanitizeInput(lastName || ""),
        email.toLowerCase(),
        passwordHash,
        phone || null,
        dateOfBirth || null,
        riskAppetite || "moderate",
      ];

      await databaseConfig.executeQuery(createUserQuery, userParams);

      // Store email verification token
      const verificationQuery = `
        INSERT INTO password_reset_tokens (
          user_id, email, token, expires_at, created_at
        ) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
      `;

      await databaseConfig.executeQuery(verificationQuery, [
        userId,
        email.toLowerCase(),
        emailVerificationToken,
      ]);

      // Send welcome email with verification link
      await this.sendWelcomeEmail(email, firstName, emailVerificationToken);

      // Create default user preferences
      const preferencesQuery = `
        INSERT INTO user_preferences (user_id) VALUES (?)
      `;
      await databaseConfig.executeQuery(preferencesQuery, [userId]);

      return ApiResponse.success(
        SUCCESS_MESSAGES.USER_CREATED,
        {
          userId,
          email: email.toLowerCase(),
          firstName,
          emailVerified: false,
          message: "Please check your email to verify your account",
        },
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error("User registration error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_ALREADY_EXISTS,
          HTTP_STATUS.CONFLICT
        );
      }

      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Promise<ApiResponse>} Login result with tokens
   */
  async loginUser(email, password, ipAddress, userAgent) {
    try {
      // Validate input
      if (!email || !password) {
        return ApiResponse.error(
          "Email and password are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Find user
      const userQuery = `
        SELECT id, first_name, last_name, email, password_hash, 
               risk_appetite, is_active, email_verified, last_login_at,
               account_balance
        FROM users 
        WHERE email = ?
      `;

      const users = await databaseConfig.executeQuery(userQuery, [
        email.toLowerCase(),
      ]);

      if (users.length === 0) {
        return ApiResponse.error(
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const user = users[0];

      // Check if account is active
      if (!user.is_active) {
        return ApiResponse.error(
          "Account has been deactivated. Please contact support.",
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Verify password
      const isPasswordValid = await AuthHelper.comparePassword(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return ApiResponse.error(
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: "user",
      };

      const accessToken = AuthHelper.generateToken(tokenPayload, "access");
      const refreshToken = AuthHelper.generateToken(tokenPayload, "refresh");

      // Store refresh token in session
      const sessionQuery = `
        INSERT INTO user_sessions (
          user_id, refresh_token, device_info, ip_address, expires_at
        ) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `;

      await databaseConfig.executeQuery(sessionQuery, [
        user.id,
        refreshToken,
        userAgent || "Unknown Device",
        ipAddress,
      ]);

      // Update last login
      const updateLoginQuery =
        "UPDATE users SET last_login_at = NOW() WHERE id = ?";
      await databaseConfig.executeQuery(updateLoginQuery, [user.id]);

      // Remove password hash from response
      const userProfile = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        riskAppetite: user.risk_appetite,
        emailVerified: user.email_verified,
        accountBalance: user.account_balance,
        lastLogin: user.last_login_at,
      };

      return ApiResponse.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, {
        user: userProfile,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        },
      });
    } catch (error) {
      console.error("User login error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Initiate password reset process
   * @param {string} email - User email
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<ApiResponse>} Password reset initiation result
   */
  async initiatePasswordReset(email, ipAddress) {
    try {
      if (!email) {
        return ApiResponse.error("Email is required", HTTP_STATUS.BAD_REQUEST);
      }

      const emailValidation = ValidationHelper.validateEmail(email);
      if (!emailValidation.isValid) {
        return ApiResponse.error(
          emailValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Find user
      const userQuery =
        "SELECT id, first_name, email, is_active FROM users WHERE email = ?";
      const users = await databaseConfig.executeQuery(userQuery, [
        email.toLowerCase(),
      ]);

      // Always return success for security (prevent email enumeration)
      if (users.length === 0) {
        return ApiResponse.success(SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
      }

      const user = users[0];

      if (!user.is_active) {
        return ApiResponse.success(SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
      }

      // Generate reset token and OTP
      const resetToken = AuthHelper.generateRandomToken();
      const otp = AuthHelper.generateOTP();

      // Store reset token
      const resetQuery = `
        INSERT INTO password_reset_tokens (
          user_id, email, token, otp, expires_at, ip_address
        ) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), ?)
        ON DUPLICATE KEY UPDATE
          token = VALUES(token),
          otp = VALUES(otp),
          expires_at = VALUES(expires_at),
          ip_address = VALUES(ip_address),
          used_at = NULL,
          created_at = NOW()
      `;

      await databaseConfig.executeQuery(resetQuery, [
        user.id,
        email.toLowerCase(),
        resetToken,
        otp,
        ipAddress,
      ]);

      // Send password reset email
      await this.sendPasswordResetEmail(
        email,
        user.first_name,
        resetToken,
        otp
      );

      return ApiResponse.success(SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
    } catch (error) {
      console.error("Password reset initiation error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Complete password reset
   * @param {string} token - Reset token
   * @param {string} otp - One-time password
   * @param {string} newPassword - New password
   * @returns {Promise<ApiResponse>} Password reset completion result
   */
  async completePasswordReset(token, otp, newPassword) {
    try {
      if (!token || !otp || !newPassword) {
        return ApiResponse.error(
          "Token, OTP, and new password are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const passwordValidation = ValidationHelper.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return ApiResponse.error(
          passwordValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Verify reset token and OTP
      const tokenQuery = `
        SELECT prt.user_id, prt.email, u.is_active
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.otp = ? 
        AND prt.expires_at > NOW() AND prt.used_at IS NULL
      `;

      const tokens = await databaseConfig.executeQuery(tokenQuery, [
        token,
        otp,
      ]);

      if (tokens.length === 0) {
        return ApiResponse.error(
          "Invalid or expired reset token",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const tokenData = tokens[0];

      if (!tokenData.is_active) {
        return ApiResponse.error(
          "Account is deactivated",
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Hash new password
      const passwordHash = await AuthHelper.hashPassword(newPassword);

      // Update password and mark token as used
      const updateQueries = [
        {
          sql: "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
          params: [passwordHash, tokenData.user_id],
        },
        {
          sql: "UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ? AND otp = ?",
          params: [token, otp],
        },
        {
          sql: "UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?",
          params: [tokenData.user_id],
        },
      ];

      await databaseConfig.executeTransaction(updateQueries);

      return ApiResponse.success(SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      console.error("Password reset completion error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<ApiResponse>} User profile data
   */
  async getUserProfile(userId) {
    try {
      const profileQuery = `
        SELECT id, first_name, last_name, email, phone, 
               date_of_birth, risk_appetite, account_balance,
               email_verified, kyc_status, last_login_at, created_at
        FROM users 
        WHERE id = ? AND is_active = TRUE
      `;

      const profiles = await databaseConfig.executeQuery(profileQuery, [
        userId,
      ]);

      if (profiles.length === 0) {
        return ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      const profile = profiles[0];

      // Get portfolio summary
      const portfolioQuery = `
        SELECT 
          COUNT(*) as total_investments,
          COALESCE(SUM(amount), 0) as total_invested,
          COALESCE(SUM(current_value), 0) as portfolio_value
        FROM investments 
        WHERE user_id = ? AND status = 'active'
      `;

      const portfolio = await databaseConfig.executeQuery(portfolioQuery, [
        userId,
      ]);

      const userProfile = {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        dateOfBirth: profile.date_of_birth,
        riskAppetite: profile.risk_appetite,
        accountBalance: profile.account_balance || 0,
        emailVerified: profile.email_verified,
        kycStatus: profile.kyc_status,
        lastLogin: profile.last_login_at,
        memberSince: profile.created_at,
        preferences: {
          notifications: {
            email: true,
            sms: false,
            marketing: false,
          },
          ui: {
            theme: 'light',
            language: 'en',
          },
        },
        portfolio: {
          totalInvestments: portfolio[0].total_investments || 0,
          totalInvested: portfolio[0].total_invested || 0,
          portfolioValue: portfolio[0].portfolio_value || 0,
        },
      };

      return ApiResponse.success("Profile retrieved successfully", userProfile);
    } catch (error) {
      console.error("Get user profile error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Profile update data
   * @returns {Promise<ApiResponse>} Update result
   */
  async updateUserProfile(userId, updateData) {
    try {
      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        riskAppetite,
        preferences,
      } = updateData;

      // Validate input data
      if (firstName) {
        const nameValidation = ValidationHelper.validateName(
          firstName,
          "First name"
        );
        if (!nameValidation.isValid) {
          return ApiResponse.error(
            nameValidation.message,
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      if (phone) {
        const phoneValidation = ValidationHelper.validatePhone(phone);
        if (!phoneValidation.isValid) {
          return ApiResponse.error(
            phoneValidation.message,
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateParams = [];

      if (firstName) {
        updateFields.push("first_name = ?");
        updateParams.push(FormatHelper.sanitizeInput(firstName));
      }

      if (lastName) {
        updateFields.push("last_name = ?");
        updateParams.push(FormatHelper.sanitizeInput(lastName));
      }

      if (phone) {
        updateFields.push("phone = ?");
        updateParams.push(phone);
      }

      if (dateOfBirth) {
        updateFields.push("date_of_birth = ?");
        updateParams.push(dateOfBirth);
      }

      if (riskAppetite && ["low", "moderate", "high"].includes(riskAppetite)) {
        updateFields.push("risk_appetite = ?");
        updateParams.push(riskAppetite);
      }

      if (updateFields.length > 0) {
        updateFields.push("updated_at = NOW()");
        updateParams.push(userId);

        const updateQuery = `UPDATE users SET ${updateFields.join(
          ", "
        )} WHERE id = ?`;
        await databaseConfig.executeQuery(updateQuery, updateParams);
      }

      // Update preferences if provided
      if (preferences) {
        const prefUpdateFields = [];
        const prefUpdateParams = [];

        if (preferences.notifications) {
          if (typeof preferences.notifications.email === "boolean") {
            prefUpdateFields.push("notification_email = ?");
            prefUpdateParams.push(preferences.notifications.email);
          }
          if (typeof preferences.notifications.sms === "boolean") {
            prefUpdateFields.push("notification_sms = ?");
            prefUpdateParams.push(preferences.notifications.sms);
          }
          if (typeof preferences.notifications.marketing === "boolean") {
            prefUpdateFields.push("marketing_emails = ?");
            prefUpdateParams.push(preferences.notifications.marketing);
          }
        }

        if (preferences.ui) {
          if (
            preferences.ui.theme &&
            ["light", "dark", "auto"].includes(preferences.ui.theme)
          ) {
            prefUpdateFields.push("theme_preference = ?");
            prefUpdateParams.push(preferences.ui.theme);
          }
          if (preferences.ui.language) {
            prefUpdateFields.push("language_preference = ?");
            prefUpdateParams.push(preferences.ui.language);
          }
        }

        if (prefUpdateFields.length > 0) {
          prefUpdateFields.push("updated_at = NOW()");
          prefUpdateParams.push(userId);

          const prefUpdateQuery = `
            UPDATE user_preferences SET ${prefUpdateFields.join(
              ", "
            )} WHERE user_id = ?
          `;
          await databaseConfig.executeQuery(prefUpdateQuery, prefUpdateParams);
        }
      }

      return ApiResponse.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      console.error("Update user profile error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logout user and invalidate session
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<ApiResponse>} Logout result
   */
  async logoutUser(userId, refreshToken) {
    try {
      if (refreshToken) {
        // Invalidate specific session
        const invalidateQuery = `
          UPDATE user_sessions 
          SET is_active = FALSE 
          WHERE user_id = ? AND refresh_token = ?
        `;
        await databaseConfig.executeQuery(invalidateQuery, [
          userId,
          refreshToken,
        ]);
      } else {
        // Invalidate all sessions for the user
        const invalidateAllQuery = `
          UPDATE user_sessions 
          SET is_active = FALSE 
          WHERE user_id = ?
        `;
        await databaseConfig.executeQuery(invalidateAllQuery, [userId]);
      }

      return ApiResponse.success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      console.error("User logout error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send welcome email to new user
   * @param {string} email - User email
   * @param {string} firstName - User first name
   * @param {string} verificationToken - Email verification token
   */
  async sendWelcomeEmail(email, firstName, verificationToken) {
    if (!this.emailTransporter) {
      console.log("Email not configured, skipping welcome email");
      return;
    }

    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: "Welcome to Grip Invest - Verify Your Email",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #2563eb;">Welcome to Grip Invest, ${firstName}! 🎉</h2>
            <p>Thank you for joining Grip Invest, your trusted investment platform.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              © 2025 Grip Invest. All rights reserved.
            </p>
          </div>
        `,
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error("Welcome email sending error:", error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} firstName - User first name
   * @param {string} resetToken - Password reset token
   * @param {string} otp - One-time password
   */
  async sendPasswordResetEmail(email, firstName, resetToken, otp) {
    if (!this.emailTransporter) {
      console.log("Email not configured, skipping password reset email");
      return;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: "Password Reset Request - Grip Invest",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #dc2626;">Password Reset Request 🔐</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password for your Grip Invest account.</p>
            <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">${otp}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            <p style="margin-top: 30px; color: #dc2626; font-weight: bold;">
              This reset link and code will expire in 1 hour.
            </p>
            <p style="color: #6b7280;">
              If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              © 2025 Grip Invest. All rights reserved.
            </p>
          </div>
        `,
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Password reset email sending error:", error);
    }
  }

  /**
   * Verify email address
   * @param {string} token - Email verification token
   * @returns {Promise<ApiResponse>} Verification result
   */
  async verifyEmail(token) {
    try {
      if (!token) {
        return ApiResponse.error(
          "Verification token is required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Find and verify token
      const tokenQuery = `
        SELECT prt.user_id, prt.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL
      `;

      const tokens = await databaseConfig.executeQuery(tokenQuery, [token]);

      if (tokens.length === 0) {
        return ApiResponse.error(
          "Invalid or expired verification token",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const tokenData = tokens[0];

      // Update user email verification status and mark token as used
      const updateQueries = [
        {
          sql: "UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = ?",
          params: [tokenData.user_id],
        },
        {
          sql: "UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?",
          params: [token],
        },
      ];

      await databaseConfig.executeTransaction(updateQueries);

      return ApiResponse.success("Email verified successfully");
    } catch (error) {
      console.error("Email verification error:", error);
      return ApiResponse.error(
        ERROR_MESSAGES.SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<ApiResponse>} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        return ApiResponse.error(
          "Refresh token is required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Verify refresh token
      const decoded = AuthHelper.verifyToken(refreshToken, "refresh");

      // Check if session is still valid
      const sessionQuery = `
        SELECT us.user_id, u.email, u.is_active
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.refresh_token = ? AND us.expires_at > NOW() AND us.is_active = TRUE
      `;

      const sessions = await databaseConfig.executeQuery(sessionQuery, [
        refreshToken,
      ]);

      if (sessions.length === 0) {
        return ApiResponse.error(
          "Invalid or expired refresh token",
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const session = sessions[0];

      if (!session.is_active) {
        return ApiResponse.error(
          "Account is deactivated",
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Generate new access token
      const tokenPayload = {
        userId: session.user_id,
        email: session.email,
        role: "user",
      };

      const newAccessToken = AuthHelper.generateToken(tokenPayload, "access");

      return ApiResponse.success("Token refreshed successfully", {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return ApiResponse.error(
        "Invalid or expired refresh token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }
  }
}

module.exports = new AuthService();
