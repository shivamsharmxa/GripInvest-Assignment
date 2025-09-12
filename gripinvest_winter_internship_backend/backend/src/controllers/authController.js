const authService = require('../services/authService');
const aiService = require('../services/aiService');
const userModel = require('../models/userModel');
const { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} = require('../utils/constants');
const { 
  ApiResponse, 
  ValidationHelper, 
  ErrorHandler,
  FormatHelper 
} = require('../utils/helpers');

/**
 * Authentication Controller Class
 * Handles all authentication-related HTTP requests
 */
class AuthController {

  /**
   * Register a new user
   * @route POST /api/auth/signup
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async signup(req, res) {
    try {
      const { firstName, lastName, email, password, phone, dateOfBirth, riskAppetite } = req.body;

      // Input validation
      if (!firstName || !email || !password) {
        const response = ApiResponse.error(
          'First name, email, and password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Register user through service
      const result = await authService.registerUser({
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        riskAppetite
      });

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Signup controller error:', error);
      const response = ErrorHandler.handleError(error, 'User registration');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Authenticate user login
   * @route POST /api/auth/login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Input validation
      if (!email || !password) {
        const response = ApiResponse.error(
          'Email and password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Authenticate user through service
      const result = await authService.loginUser(email, password, ipAddress, userAgent);

      // If login is successful, analyze user behavior for security
      if (result.success && result.data.user) {
        try {
          // Perform risk analysis in background (don't block response)
          setImmediate(async () => {
            try {
              const behaviorData = {
                ipAddress,
                userAgent,
                loginTime: new Date(),
                endpoint: req.originalUrl
              };
              
              await aiService.analyzeUserBehaviorRisk(result.data.user.id, behaviorData);
            } catch (riskError) {
              console.warn('Background risk analysis failed:', riskError.message);
            }
          });
        } catch (error) {
          // Don't let background analysis affect login response
          console.warn('Risk analysis initiation failed:', error.message);
        }
      }

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Login controller error:', error);
      const response = ErrorHandler.handleError(error, 'User login');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Initiate password reset
   * @route POST /api/auth/forgot-password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Input validation
      if (!email) {
        const response = ApiResponse.error(
          'Email is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Initiate password reset through service
      const result = await authService.initiatePasswordReset(email, ipAddress);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Forgot password controller error:', error);
      const response = ErrorHandler.handleError(error, 'Password reset initiation');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Complete password reset
   * @route POST /api/auth/reset-password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      const { token, otp, newPassword, confirmPassword } = req.body;

      // Input validation
      if (!token || !otp || !newPassword) {
        const response = ApiResponse.error(
          'Token, OTP, and new password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        const response = ApiResponse.error(
          'Passwords do not match',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Complete password reset through service
      const result = await authService.completePasswordReset(token, otp, newPassword);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Reset password controller error:', error);
      const response = ErrorHandler.handleError(error, 'Password reset completion');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get user profile
   * @route GET /api/auth/profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      // Get user profile through service
      const result = await authService.getUserProfile(req.user.id);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Get profile controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get user profile');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Update user profile
   * @route PUT /api/auth/profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const updateData = req.body;

      // Update user profile through service
      const result = await authService.updateUserProfile(req.user.id, updateData);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Update profile controller error:', error);
      const response = ErrorHandler.handleError(error, 'Update user profile');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Logout user
   * @route POST /api/auth/logout
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;

      // Logout user through service
      const result = await authService.logoutUser(req.user.id, refreshToken);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Logout controller error:', error);
      const response = ErrorHandler.handleError(error, 'User logout');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Verify email address
   * @route POST /api/auth/verify-email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      // Input validation
      if (!token) {
        const response = ApiResponse.error(
          'Verification token is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Verify email through service
      const result = await authService.verifyEmail(token);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Email verification controller error:', error);
      const response = ErrorHandler.handleError(error, 'Email verification');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Refresh access token
   * @route POST /api/auth/refresh-token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;

      // Input validation
      if (!refreshToken) {
        const response = ApiResponse.error(
          'Refresh token is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Refresh token through service
      const result = await authService.refreshAccessToken(refreshToken);

      return res.status(result.statusCode).json(result);

    } catch (error) {
      console.error('Refresh token controller error:', error);
      const response = ErrorHandler.handleError(error, 'Token refresh');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Analyze password strength using AI
   * @route POST /api/auth/analyze-password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async analyzePassword(req, res) {
    try {
      const { password, userContext } = req.body;

      // Input validation
      if (!password) {
        const response = ApiResponse.error(
          'Password is required for analysis',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Analyze password strength using AI
      const analysis = await aiService.analyzePasswordStrength(password, userContext || {});

      const response = ApiResponse.success(
        'Password analysis completed',
        {
          analysis,
          timestamp: new Date().toISOString()
        }
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Password analysis controller error:', error);
      const response = ErrorHandler.handleError(error, 'Password analysis');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get security recommendations for user
   * @route GET /api/auth/security-recommendations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSecurityRecommendations(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      // Get user profile for recommendations
      const userProfile = await userModel.findById(req.user.id);
      if (!userProfile) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      // Generate security recommendations
      const recommendations = await aiService.generateSecurityRecommendations(userProfile);

      const response = ApiResponse.success(
        'Security recommendations generated',
        recommendations
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Security recommendations controller error:', error);
      const response = ErrorHandler.handleError(error, 'Security recommendations');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get user behavior risk analysis
   * @route GET /api/auth/risk-analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRiskAnalysis(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const behaviorData = {
        currentSession: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestTime: new Date()
        }
      };

      // Analyze user behavior risk
      const riskAnalysis = await aiService.analyzeUserBehaviorRisk(req.user.id, behaviorData);

      const response = ApiResponse.success(
        'Risk analysis completed',
        {
          riskAnalysis,
          userId: req.user.id,
          timestamp: new Date().toISOString()
        }
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Risk analysis controller error:', error);
      const response = ErrorHandler.handleError(error, 'Risk analysis');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Change password for authenticated user
   * @route POST /api/auth/change-password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changePassword(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Input validation
      if (!currentPassword || !newPassword) {
        const response = ApiResponse.error(
          'Current password and new password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        const response = ApiResponse.error(
          'New passwords do not match',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Validate new password strength
      const passwordValidation = ValidationHelper.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        const response = ApiResponse.error(
          passwordValidation.message,
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Get current user with password hash
      const user = await userModel.findById(req.user.id, true);
      if (!user) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      // Verify current password
      const { AuthHelper } = require('../utils/helpers');
      const isCurrentPasswordValid = await AuthHelper.comparePassword(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        const response = ApiResponse.error(
          'Current password is incorrect',
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      // Hash new password
      const newPasswordHash = await AuthHelper.hashPassword(newPassword);

      // Update password
      await userModel.update(req.user.id, { passwordHash: newPasswordHash });

      // Invalidate all existing sessions for security
      await authService.logoutUser(req.user.id);

      const response = ApiResponse.success(
        'Password changed successfully. Please login again.',
        { 
          message: 'All sessions have been terminated for security. Please login with your new password.' 
        }
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Change password controller error:', error);
      const response = ErrorHandler.handleError(error, 'Change password');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Get user's active sessions
   * @route GET /api/auth/sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSessions(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      // Get active sessions from database
      const { databaseConfig } = require('../config/database');
      const sessionsQuery = `
        SELECT id, device_info, ip_address, created_at, expires_at
        FROM user_sessions
        WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
        ORDER BY created_at DESC
      `;

      const sessions = await databaseConfig.executeQuery(sessionsQuery, [req.user.id]);

      const formattedSessions = sessions.map(session => ({
        id: session.id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        isCurrent: req.headers['x-refresh-token'] && 
                  session.refresh_token === req.headers['x-refresh-token']
      }));

      const response = ApiResponse.success(
        'Active sessions retrieved',
        {
          sessions: formattedSessions,
          totalSessions: formattedSessions.length
        }
      );

      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Get sessions controller error:', error);
      const response = ErrorHandler.handleError(error, 'Get sessions');
      return res.status(response.statusCode).json(response);
    }
  }

  /**
   * Revoke a specific session
   * @route DELETE /api/auth/sessions/:sessionId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async revokeSession(req, res) {
    try {
      if (!req.user || !req.user.id) {
        const response = ApiResponse.error(
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.UNAUTHORIZED
        );
        return res.status(response.statusCode).json(response);
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        const response = ApiResponse.error(
          'Session ID is required',
          HTTP_STATUS.BAD_REQUEST
        );
        return res.status(response.statusCode).json(response);
      }

      // Revoke specific session
      const { databaseConfig } = require('../config/database');
      const revokeQuery = `
        UPDATE user_sessions 
        SET is_active = FALSE 
        WHERE id = ? AND user_id = ?
      `;

      const result = await databaseConfig.executeQuery(revokeQuery, [sessionId, req.user.id]);

      if (result.affectedRows === 0) {
        const response = ApiResponse.error(
          'Session not found or already revoked',
          HTTP_STATUS.NOT_FOUND
        );
        return res.status(response.statusCode).json(response);
      }

      const response = ApiResponse.success('Session revoked successfully');
      return res.status(response.statusCode).json(response);

    } catch (error) {
      console.error('Revoke session controller error:', error);
      const response = ErrorHandler.handleError(error, 'Revoke session');
      return res.status(response.statusCode).json(response);
    }
  }
}

module.exports = new AuthController();