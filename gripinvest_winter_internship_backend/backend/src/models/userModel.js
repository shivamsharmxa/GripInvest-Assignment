const { databaseConfig } = require('../config/database');
const { FormatHelper } = require('../utils/helpers');
const { RISK_LEVELS } = require('../utils/constants');

/**
 * User Model Class
 * Handles all database operations related to users
 */
class UserModel {
  constructor() {
    this.tableName = 'users';
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user data
   */
  async create(userData) {
    try {
      const userId = FormatHelper.generateUUID();
      
      const query = `
        INSERT INTO ${this.tableName} (
          id, first_name, last_name, email, password_hash,
          phone, date_of_birth, risk_appetite, account_balance,
          email_verified, kyc_verified, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        userId,
        userData.firstName,
        userData.lastName || null,
        userData.email,
        userData.passwordHash,
        userData.phone || null,
        userData.dateOfBirth || null,
        userData.riskAppetite || 'moderate',
        userData.accountBalance || 50000.00,
        userData.emailVerified || false,
        userData.kycVerified || false,
        userData.isActive !== false
      ];

      await databaseConfig.executeQuery(query, params);

      // Return created user (without password hash)
      return this.findById(userId);

    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @param {boolean} includePassword - Whether to include password hash
   * @returns {Promise<Object|null>} User data or null
   */
  async findById(userId, includePassword = false) {
    try {
      const fields = includePassword 
        ? 'id, first_name, last_name, email, password_hash, phone, date_of_birth, risk_appetite, account_balance, email_verified, kyc_status, is_active, last_login_at, created_at, updated_at'
        : 'id, first_name, last_name, email, phone, date_of_birth, risk_appetite, account_balance, email_verified, kyc_status, is_active, last_login_at, created_at, updated_at';

      const query = `SELECT ${fields} FROM ${this.tableName} WHERE id = ?`;
      const users = await databaseConfig.executeQuery(query, [userId]);

      if (users.length === 0) {
        return null;
      }

      return this.formatUserData(users[0]);

    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Whether to include password hash
   * @returns {Promise<Object|null>} User data or null
   */
  async findByEmail(email, includePassword = false) {
    try {
      const fields = includePassword 
        ? 'id, first_name, last_name, email, password_hash, phone, date_of_birth, risk_appetite, account_balance, email_verified, kyc_status, is_active, last_login_at, created_at, updated_at'
        : 'id, first_name, last_name, email, phone, date_of_birth, risk_appetite, account_balance, email_verified, kyc_status, is_active, last_login_at, created_at, updated_at';

      const query = `SELECT ${fields} FROM ${this.tableName} WHERE email = ?`;
      const users = await databaseConfig.executeQuery(query, [email.toLowerCase()]);

      if (users.length === 0) {
        return null;
      }

      return this.formatUserData(users[0]);

    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user data
   */
  async update(userId, updateData) {
    try {
      const updateFields = [];
      const updateParams = [];

      // Build dynamic update query
      if (updateData.firstName !== undefined) {
        updateFields.push('first_name = ?');
        updateParams.push(updateData.firstName);
      }

      if (updateData.lastName !== undefined) {
        updateFields.push('last_name = ?');
        updateParams.push(updateData.lastName);
      }

      if (updateData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateParams.push(updateData.phone);
      }

      if (updateData.dateOfBirth !== undefined) {
        updateFields.push('date_of_birth = ?');
        updateParams.push(updateData.dateOfBirth);
      }

      if (updateData.riskAppetite !== undefined && Object.values(RISK_LEVELS).includes(updateData.riskAppetite)) {
        updateFields.push('risk_appetite = ?');
        updateParams.push(updateData.riskAppetite);
      }

      if (updateData.accountBalance !== undefined) {
        updateFields.push('account_balance = ?');
        updateParams.push(updateData.accountBalance);
      }

      if (updateData.emailVerified !== undefined) {
        updateFields.push('email_verified = ?');
        updateParams.push(updateData.emailVerified);
      }

      if (updateData.kycVerified !== undefined) {
        updateFields.push('kyc_verified = ?');
        updateParams.push(updateData.kycVerified);
      }

      if (updateData.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateParams.push(updateData.isActive);
      }

      if (updateData.passwordHash !== undefined) {
        updateFields.push('password_hash = ?');
        updateParams.push(updateData.passwordHash);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at and user ID
      updateFields.push('updated_at = NOW()');
      updateParams.push(userId);

      const query = `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`;
      const result = await databaseConfig.executeQuery(query, updateParams);

      if (result.affectedRows === 0) {
        throw new Error('User not found or no changes made');
      }

      // Return updated user
      return this.findById(userId);

    } catch (error) {
      console.error('User update error:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(userId) {
    try {
      const query = `UPDATE ${this.tableName} SET is_active = FALSE, updated_at = NOW() WHERE id = ?`;
      const result = await databaseConfig.executeQuery(query, [userId]);

      return result.affectedRows > 0;

    } catch (error) {
      console.error('User deletion error:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      const query = `UPDATE ${this.tableName} SET last_login_at = NOW() WHERE id = ?`;
      await databaseConfig.executeQuery(query, [userId]);

    } catch (error) {
      console.error('Update last login error:', error);
      throw error;
    }
  }

  /**
   * Update user's account balance
   * @param {string} userId - User ID
   * @param {number} amount - Amount to add/subtract
   * @param {string} operation - 'add' or 'subtract'
   * @returns {Promise<Object>} Updated user with new balance
   */
  async updateBalance(userId, amount, operation = 'subtract') {
    try {
      const operator = operation === 'add' ? '+' : '-';
      const query = `
        UPDATE ${this.tableName} 
        SET account_balance = account_balance ${operator} ?, updated_at = NOW() 
        WHERE id = ? AND account_balance ${operator === '+' ? '>=' : '>='} ?
      `;

      const minBalance = operation === 'subtract' ? amount : 0;
      const result = await databaseConfig.executeQuery(query, [amount, userId, minBalance]);

      if (result.affectedRows === 0) {
        throw new Error('Insufficient balance or user not found');
      }

      return this.findById(userId);

    } catch (error) {
      console.error('Update balance error:', error);
      throw error;
    }
  }

  /**
   * Get user's investment statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Investment statistics
   */
  async getInvestmentStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_investments,
          COALESCE(SUM(amount), 0) as total_invested,
          COALESCE(SUM(current_value), 0) as portfolio_value,
          COALESCE(SUM(current_value - amount), 0) as total_returns,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_investments,
          COUNT(CASE WHEN status = 'matured' THEN 1 END) as matured_investments,
          AVG(CASE WHEN status = 'active' THEN 
            ((current_value - amount) / amount) * 100 
          END) as avg_return_percentage
        FROM investments 
        WHERE user_id = ?
      `;

      const stats = await databaseConfig.executeQuery(query, [userId]);
      
      if (stats.length === 0) {
        return {
          totalInvestments: 0,
          totalInvested: 0,
          portfolioValue: 0,
          totalReturns: 0,
          activeInvestments: 0,
          maturedInvestments: 0,
          avgReturnPercentage: 0
        };
      }

      const stat = stats[0];
      return {
        totalInvestments: stat.total_investments,
        totalInvested: parseFloat(stat.total_invested),
        portfolioValue: parseFloat(stat.portfolio_value),
        totalReturns: parseFloat(stat.total_returns),
        activeInvestments: stat.active_investments,
        maturedInvestments: stat.matured_investments,
        avgReturnPercentage: parseFloat(stat.avg_return_percentage) || 0
      };

    } catch (error) {
      console.error('Get investment stats error:', error);
      throw error;
    }
  }

  /**
   * Get user's recent activity
   * @param {string} userId - User ID
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivity(userId, limit = 10) {
    try {
      const query = `
        SELECT endpoint, http_method, status_code, created_at,
               ip_address, user_agent
        FROM transaction_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const activities = await databaseConfig.executeQuery(query, [userId, limit]);

      return activities.map(activity => ({
        endpoint: activity.endpoint,
        method: activity.http_method,
        statusCode: activity.status_code,
        timestamp: activity.created_at,
        ipAddress: activity.ip_address,
        userAgent: activity.user_agent
      }));

    } catch (error) {
      console.error('Get recent activity error:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeUserId - User ID to exclude from check
   * @returns {Promise<boolean>} Whether email exists
   */
  async emailExists(email, excludeUserId = null) {
    try {
      let query = `SELECT id FROM ${this.tableName} WHERE email = ?`;
      let params = [email.toLowerCase()];

      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }

      const users = await databaseConfig.executeQuery(query, params);
      return users.length > 0;

    } catch (error) {
      console.error('Email exists check error:', error);
      throw error;
    }
  }

  /**
   * Get users by criteria with pagination
   * @param {Object} criteria - Search criteria
   * @param {number} offset - Pagination offset
   * @param {number} limit - Pagination limit
   * @returns {Promise<Object>} Users and total count
   */
  async findByCriteria(criteria = {}, offset = 0, limit = 10) {
    try {
      let whereConditions = ['1 = 1']; // Base condition
      let params = [];

      if (criteria.email) {
        whereConditions.push('email LIKE ?');
        params.push(`%${criteria.email}%`);
      }

      if (criteria.firstName) {
        whereConditions.push('first_name LIKE ?');
        params.push(`%${criteria.firstName}%`);
      }

      if (criteria.lastName) {
        whereConditions.push('last_name LIKE ?');
        params.push(`%${criteria.lastName}%`);
      }

      if (criteria.riskAppetite) {
        whereConditions.push('risk_appetite = ?');
        params.push(criteria.riskAppetite);
      }

      if (criteria.emailVerified !== undefined) {
        whereConditions.push('email_verified = ?');
        params.push(criteria.emailVerified);
      }

      if (criteria.kycVerified !== undefined) {
        whereConditions.push('kyc_verified = ?');
        params.push(criteria.kycVerified);
      }

      if (criteria.isActive !== undefined) {
        whereConditions.push('is_active = ?');
        params.push(criteria.isActive);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`;
      const countResult = await databaseConfig.executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get users
      const usersQuery = `
        SELECT id, first_name, last_name, email, phone, date_of_birth,
               risk_appetite, account_balance, email_verified, kyc_status,
               is_active, last_login_at, created_at, updated_at
        FROM ${this.tableName} 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const users = await databaseConfig.executeQuery(usersQuery, [...params, limit, offset]);

      return {
        users: users.map(user => this.formatUserData(user)),
        total,
        offset,
        limit
      };

    } catch (error) {
      console.error('Find users by criteria error:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User preferences
   */
  async getPreferences(userId) {
    try {
      const query = `
        SELECT notification_email, notification_sms, marketing_emails,
               investment_alerts, maturity_reminders, weekly_reports,
               theme_preference, language_preference, timezone
        FROM user_preferences 
        WHERE user_id = ?
      `;

      const preferences = await databaseConfig.executeQuery(query, [userId]);

      if (preferences.length === 0) {
        return null;
      }

      return preferences[0];

    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      const updateFields = [];
      const updateParams = [];

      // Build dynamic update query for preferences
      const allowedFields = [
        'notification_email', 'notification_sms', 'marketing_emails',
        'investment_alerts', 'maturity_reminders', 'weekly_reports',
        'theme_preference', 'language_preference', 'timezone'
      ];

      allowedFields.forEach(field => {
        if (preferences[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateParams.push(preferences[field]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid preferences to update');
      }

      updateFields.push('updated_at = NOW()');
      updateParams.push(userId);

      const query = `
        UPDATE user_preferences 
        SET ${updateFields.join(', ')} 
        WHERE user_id = ?
      `;

      const result = await databaseConfig.executeQuery(query, updateParams);

      if (result.affectedRows === 0) {
        // Create preferences if they don't exist
        const createQuery = `
          INSERT INTO user_preferences (user_id) VALUES (?)
          ON DUPLICATE KEY UPDATE updated_at = NOW()
        `;
        await databaseConfig.executeQuery(createQuery, [userId]);

        // Try update again
        await databaseConfig.executeQuery(query, updateParams);
      }

      return this.getPreferences(userId);

    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  }

  /**
   * Format user data for response
   * @param {Object} userData - Raw user data from database
   * @returns {Object} Formatted user data
   */
  formatUserData(userData) {
    return {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      dateOfBirth: userData.date_of_birth,
      riskAppetite: userData.risk_appetite,
      accountBalance: userData.account_balance ? parseFloat(userData.account_balance) : 0,
      emailVerified: !!userData.email_verified,
      kycStatus: userData.kyc_status,
      isActive: !!userData.is_active,
      lastLogin: userData.last_login_at,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      // Include password hash only if it exists in the original data
      ...(userData.password_hash && { passwordHash: userData.password_hash })
    };
  }
}

module.exports = new UserModel();