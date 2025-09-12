const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { databaseConfig } = require('../config/database');
const { 
  AI_MODELS, 
  AI_RECOMMENDATION_TYPES,
  HTTP_STATUS,
  CACHE_DURATIONS 
} = require('../utils/constants');
const { ApiResponse } = require('../utils/helpers');

/**
 * AI Service Class
 * Handles all AI-powered features for authentication and investment recommendations
 */
class AIService {
  constructor() {
    this.openai = null;
    this.gemini = null;
    this.initializeAIClients();
  }

  /**
   * Initialize AI clients (OpenAI and Google Gemini)
   */
  initializeAIClients() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI client initialized');
      } catch (error) {
        console.warn('⚠️ OpenAI initialization failed:', error.message);
      }
    }

    // Initialize Google Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Google Gemini client initialized');
      } catch (error) {
        console.warn('⚠️ Google Gemini initialization failed:', error.message);
      }
    }

    if (!this.openai && !this.gemini) {
      console.warn('⚠️ No AI clients initialized. AI features will return mock responses.');
    }
  }

  /**
   * Analyze password strength using AI
   * @param {string} password - Password to analyze
   * @param {Object} userContext - User context (name, email, etc.)
   * @returns {Promise<Object>} Password analysis result
   */
  async analyzePasswordStrength(password, userContext = {}) {
    try {
      if (!password) {
        return {
          score: 0,
          strength: 'Very Weak',
          issues: ['Password is required'],
          suggestions: ['Please enter a password'],
          aiAnalysis: null
        };
      }

      // Basic strength analysis
      const basicAnalysis = this.performBasicPasswordAnalysis(password, userContext);

      // AI-enhanced analysis if available
      let aiAnalysis = null;
      if (this.openai || this.gemini) {
        try {
          aiAnalysis = await this.performAIPasswordAnalysis(password, userContext);
        } catch (error) {
          console.warn('AI password analysis failed:', error.message);
        }
      }

      // Combine basic and AI analysis
      return this.combinePasswordAnalysis(basicAnalysis, aiAnalysis);

    } catch (error) {
      console.error('Password strength analysis error:', error);
      return {
        score: 0,
        strength: 'Error',
        issues: ['Analysis failed'],
        suggestions: ['Please try again'],
        aiAnalysis: null
      };
    }
  }

  /**
   * Perform basic password strength analysis
   * @param {string} password - Password to analyze
   * @param {Object} userContext - User context
   * @returns {Object} Basic analysis result
   */
  performBasicPasswordAnalysis(password, userContext) {
    const issues = [];
    const suggestions = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      issues.push('Password is too short');
      suggestions.push('Use at least 8 characters');
    } else if (password.length >= 12) {
      score += 25;
    } else {
      score += 15;
      suggestions.push('Consider using 12+ characters for better security');
    }

    // Character variety checks
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowerCase) {
      issues.push('Missing lowercase letters');
      suggestions.push('Add lowercase letters (a-z)');
    } else {
      score += 15;
    }

    if (!hasUpperCase) {
      issues.push('Missing uppercase letters');
      suggestions.push('Add uppercase letters (A-Z)');
    } else {
      score += 15;
    }

    if (!hasNumbers) {
      issues.push('Missing numbers');
      suggestions.push('Add numbers (0-9)');
    } else {
      score += 15;
    }

    if (!hasSpecialChars) {
      issues.push('Missing special characters');
      suggestions.push('Add special characters (!@#$%^&*)');
    } else {
      score += 20;
    }

    // Pattern checks
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Contains repeated characters');
      suggestions.push('Avoid repeating the same character');
      score -= 10;
    }

    if (/123|abc|qwe|password|admin|user/i.test(password)) {
      issues.push('Contains common patterns');
      suggestions.push('Avoid common sequences and words');
      score -= 20;
    }

    // Personal information check
    if (userContext.firstName && password.toLowerCase().includes(userContext.firstName.toLowerCase())) {
      issues.push('Contains personal information');
      suggestions.push('Avoid using your name in passwords');
      score -= 15;
    }

    if (userContext.email) {
      const emailPrefix = userContext.email.split('@')[0];
      if (password.toLowerCase().includes(emailPrefix.toLowerCase())) {
        issues.push('Contains email information');
        suggestions.push('Avoid using parts of your email in passwords');
        score -= 15;
      }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strength;
    if (score >= 80) strength = 'Very Strong';
    else if (score >= 60) strength = 'Strong';
    else if (score >= 40) strength = 'Moderate';
    else if (score >= 20) strength = 'Weak';
    else strength = 'Very Weak';

    return { score, strength, issues, suggestions };
  }

  /**
   * Perform AI-enhanced password analysis
   * @param {string} password - Password to analyze
   * @param {Object} userContext - User context
   * @returns {Promise<Object>} AI analysis result
   */
  async performAIPasswordAnalysis(password, userContext) {
    const prompt = `
Analyze this password for security strength and provide recommendations:

Password characteristics to analyze:
- Length: ${password.length} characters
- Contains uppercase: ${/[A-Z]/.test(password)}
- Contains lowercase: ${/[a-z]/.test(password)}
- Contains numbers: ${/\d/.test(password)}
- Contains special chars: ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}

User context:
- Has first name: ${!!userContext.firstName}
- Has email: ${!!userContext.email}

Please provide:
1. Security assessment (1-10 scale)
2. Key strengths
3. Main vulnerabilities
4. Specific improvement suggestions
5. Industry best practices recommendation

Respond in JSON format:
{
  "securityScore": number,
  "strengths": ["strength1", "strength2"],
  "vulnerabilities": ["vuln1", "vuln2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "bestPractices": "recommendation text"
}

Do not include the actual password in your response.
`;

    try {
      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 500,
          temperature: 0.3
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      // Parse JSON response
      const aiResult = JSON.parse(response);
      return aiResult;

    } catch (error) {
      console.error('AI password analysis error:', error);
      throw error;
    }
  }

  /**
   * Combine basic and AI password analysis
   * @param {Object} basicAnalysis - Basic analysis result
   * @param {Object} aiAnalysis - AI analysis result
   * @returns {Object} Combined analysis
   */
  combinePasswordAnalysis(basicAnalysis, aiAnalysis) {
    if (!aiAnalysis) {
      return {
        ...basicAnalysis,
        aiEnhanced: false
      };
    }

    // Combine scores (weighted average)
    const combinedScore = Math.round((basicAnalysis.score * 0.6) + ((aiAnalysis.securityScore * 10) * 0.4));

    // Merge suggestions
    const allSuggestions = [
      ...basicAnalysis.suggestions,
      ...aiAnalysis.suggestions
    ].filter((suggestion, index, self) => 
      self.indexOf(suggestion) === index // Remove duplicates
    );

    return {
      score: combinedScore,
      strength: this.getStrengthFromScore(combinedScore),
      issues: basicAnalysis.issues,
      suggestions: allSuggestions,
      aiAnalysis: {
        securityScore: aiAnalysis.securityScore,
        strengths: aiAnalysis.strengths,
        vulnerabilities: aiAnalysis.vulnerabilities,
        bestPractices: aiAnalysis.bestPractices
      },
      aiEnhanced: true
    };
  }

  /**
   * Get strength level from numeric score
   * @param {number} score - Numeric score (0-100)
   * @returns {string} Strength level
   */
  getStrengthFromScore(score) {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  }

  /**
   * Analyze user behavior for security risks
   * @param {string} userId - User ID
   * @param {Object} behaviorData - Recent behavior data
   * @returns {Promise<Object>} Risk analysis result
   */
  async analyzeUserBehaviorRisk(userId, behaviorData) {
    try {
      // Get user's recent activity from transaction logs
      const activityQuery = `
        SELECT endpoint, http_method, status_code, ip_address, 
               user_agent, created_at
        FROM transaction_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const activities = await databaseConfig.executeQuery(activityQuery, [userId]);

      if (activities.length === 0) {
        return {
          riskLevel: 'Low',
          riskScore: 0,
          alerts: [],
          recommendations: ['Continue normal usage patterns'],
          analysis: 'Insufficient data for analysis'
        };
      }

      // Analyze patterns
      const riskAnalysis = this.analyzeBehaviorPatterns(activities, behaviorData);

      // AI-enhanced risk assessment if available
      if (this.openai || this.gemini) {
        try {
          const aiRiskAnalysis = await this.performAIRiskAnalysis(activities, behaviorData);
          return this.combineRiskAnalysis(riskAnalysis, aiRiskAnalysis);
        } catch (error) {
          console.warn('AI risk analysis failed:', error.message);
        }
      }

      return riskAnalysis;

    } catch (error) {
      console.error('User behavior risk analysis error:', error);
      return {
        riskLevel: 'Unknown',
        riskScore: 0,
        alerts: ['Analysis failed'],
        recommendations: ['Please contact support if you suspect unusual activity'],
        analysis: 'Error analyzing behavior'
      };
    }
  }

  /**
   * Analyze behavior patterns for security risks
   * @param {Array} activities - User activities
   * @param {Object} behaviorData - Current behavior data
   * @returns {Object} Risk analysis
   */
  analyzeBehaviorPatterns(activities, behaviorData) {
    const alerts = [];
    const recommendations = [];
    let riskScore = 0;

    // Check for multiple IP addresses
    const ipAddresses = [...new Set(activities.map(a => a.ip_address))];
    if (ipAddresses.length > 3) {
      alerts.push('Multiple IP addresses detected');
      recommendations.push('Verify all login locations are legitimate');
      riskScore += 30;
    }

    // Check for failed login attempts
    const failedLogins = activities.filter(a => 
      a.endpoint.includes('/auth/login') && a.status_code >= 400
    );
    if (failedLogins.length > 3) {
      alerts.push('Multiple failed login attempts');
      recommendations.push('Consider changing your password');
      riskScore += 40;
    }

    // Check for unusual time patterns
    const recentActivities = activities.filter(a => 
      new Date() - new Date(a.created_at) < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    if (recentActivities.length > 50) {
      alerts.push('Unusually high activity volume');
      recommendations.push('Review recent account activity');
      riskScore += 20;
    }

    // Check for user agent variations
    const userAgents = [...new Set(activities.map(a => a.user_agent))];
    if (userAgents.length > 3) {
      alerts.push('Multiple devices/browsers detected');
      recommendations.push('Verify all devices are yours');
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel;
    if (riskScore >= 70) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';
    else if (riskScore >= 20) riskLevel = 'Low';
    else riskLevel = 'Minimal';

    if (alerts.length === 0) {
      recommendations.push('Your account activity appears normal');
    }

    return {
      riskLevel,
      riskScore,
      alerts,
      recommendations,
      analysis: `Analyzed ${activities.length} recent activities`
    };
  }

  /**
   * Perform AI-enhanced risk analysis
   * @param {Array} activities - User activities
   * @param {Object} behaviorData - Current behavior data
   * @returns {Promise<Object>} AI risk analysis
   */
  async performAIRiskAnalysis(activities, behaviorData) {
    const prompt = `
Analyze these user behavior patterns for security risks:

Activity Summary:
- Total activities: ${activities.length}
- Unique IP addresses: ${[...new Set(activities.map(a => a.ip_address))].length}
- Failed requests: ${activities.filter(a => a.status_code >= 400).length}
- Time span: ${activities.length > 0 ? 
  `${Math.round((new Date(activities[0].created_at) - new Date(activities[activities.length - 1].created_at)) / (1000 * 60 * 60))} hours` : 'N/A'
}

Recent endpoints accessed:
${activities.slice(0, 10).map(a => `${a.http_method} ${a.endpoint} (${a.status_code})`).join('\n')}

Please analyze for:
1. Suspicious patterns
2. Security risks
3. Anomalies
4. Fraud indicators

Respond in JSON format:
{
  "riskScore": number (0-100),
  "suspiciousPatterns": ["pattern1", "pattern2"],
  "securityConcerns": ["concern1", "concern2"],
  "recommendations": ["rec1", "rec2"],
  "fraudProbability": number (0-1),
  "reasoning": "explanation"
}
`;

    try {
      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
          temperature: 0.2
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('AI risk analysis error:', error);
      throw error;
    }
  }

  /**
   * Combine basic and AI risk analysis
   * @param {Object} basicAnalysis - Basic risk analysis
   * @param {Object} aiAnalysis - AI risk analysis
   * @returns {Object} Combined analysis
   */
  combineRiskAnalysis(basicAnalysis, aiAnalysis) {
    const combinedScore = Math.round((basicAnalysis.riskScore * 0.5) + (aiAnalysis.riskScore * 0.5));
    
    return {
      riskLevel: this.getRiskLevelFromScore(combinedScore),
      riskScore: combinedScore,
      alerts: [...basicAnalysis.alerts, ...aiAnalysis.suspiciousPatterns],
      recommendations: [...basicAnalysis.recommendations, ...aiAnalysis.recommendations],
      analysis: basicAnalysis.analysis,
      aiEnhanced: true,
      fraudProbability: aiAnalysis.fraudProbability,
      reasoning: aiAnalysis.reasoning
    };
  }

  /**
   * Get risk level from numeric score
   * @param {number} score - Risk score (0-100)
   * @returns {string} Risk level
   */
  getRiskLevelFromScore(score) {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Minimal';
  }

  /**
   * Generate security recommendations based on user profile
   * @param {Object} userProfile - User profile data
   * @returns {Promise<Object>} Security recommendations
   */
  async generateSecurityRecommendations(userProfile) {
    try {
      const recommendations = [];

      // Basic security recommendations
      if (!userProfile.emailVerified) {
        recommendations.push({
          type: 'email_verification',
          priority: 'high',
          title: 'Verify Your Email',
          description: 'Verify your email address to secure your account and enable important notifications.'
        });
      }

      if (!userProfile.kycVerified) {
        recommendations.push({
          type: 'kyc_verification',
          priority: 'medium',
          title: 'Complete KYC Verification',
          description: 'Complete your KYC verification to unlock all investment features and higher limits.'
        });
      }

      // Check last login
      if (userProfile.lastLogin) {
        const daysSinceLogin = Math.floor((new Date() - new Date(userProfile.lastLogin)) / (1000 * 60 * 60 * 24));
        if (daysSinceLogin > 30) {
          recommendations.push({
            type: 'login_frequency',
            priority: 'low',
            title: 'Regular Account Access',
            description: 'Consider logging in more frequently to monitor your investments and account security.'
          });
        }
      }

      // AI-enhanced security recommendations
      if (this.openai || this.gemini) {
        try {
          const aiRecommendations = await this.generateAISecurityRecommendations(userProfile);
          recommendations.push(...aiRecommendations);
        } catch (error) {
          console.warn('AI security recommendations failed:', error.message);
        }
      }

      return {
        recommendations,
        totalCount: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Security recommendations generation error:', error);
      return {
        recommendations: [{
          type: 'error',
          priority: 'medium',
          title: 'Security Check',
          description: 'Unable to generate recommendations. Please ensure your account information is up to date.'
        }],
        totalCount: 1,
        highPriority: 0,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate AI-enhanced security recommendations
   * @param {Object} userProfile - User profile data
   * @returns {Promise<Array>} AI security recommendations
   */
  async generateAISecurityRecommendations(userProfile) {
    const prompt = `
Generate personalized security recommendations for a user with this profile:

Profile:
- Email verified: ${userProfile.emailVerified}
- KYC verified: ${userProfile.kycVerified}
- Risk appetite: ${userProfile.riskAppetite}
- Account balance: ${userProfile.accountBalance}
- Member since: ${userProfile.memberSince}
- Last login: ${userProfile.lastLogin}

Generate 2-3 specific, actionable security recommendations based on:
1. Account security best practices
2. Financial security for investment platforms
3. Risk management based on user profile

Respond in JSON format:
[
  {
    "type": "recommendation_type",
    "priority": "high|medium|low",
    "title": "Short title",
    "description": "Detailed description with specific action steps"
  }
]
`;

    try {
      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.4
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('AI security recommendations error:', error);
      return [];
    }
  }

  /**
   * Cache AI recommendation for future use
   * @param {string} userId - User ID
   * @param {string} type - Recommendation type
   * @param {Object} data - Recommendation data
   * @param {number} confidenceScore - Confidence score
   */
  async cacheAIRecommendation(userId, type, data, confidenceScore = 0.8) {
    try {
      const cacheQuery = `
        INSERT INTO ai_recommendations (
          user_id, recommendation_type, recommendation_data, 
          confidence_score, model_version, expires_at
        ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
        ON DUPLICATE KEY UPDATE
          recommendation_data = VALUES(recommendation_data),
          confidence_score = VALUES(confidence_score),
          expires_at = VALUES(expires_at),
          created_at = NOW()
      `;

      await databaseConfig.executeQuery(cacheQuery, [
        userId,
        type,
        JSON.stringify(data),
        confidenceScore,
        process.env.AI_MODEL || 'gpt-3.5-turbo',
        CACHE_DURATIONS.AI_RECOMMENDATIONS
      ]);

    } catch (error) {
      console.error('AI recommendation caching error:', error);
    }
  }

  /**
   * Get cached AI recommendation
   * @param {string} userId - User ID
   * @param {string} type - Recommendation type
   * @returns {Promise<Object|null>} Cached recommendation or null
   */
  async getCachedAIRecommendation(userId, type) {
    try {
      const cacheQuery = `
        SELECT recommendation_data, confidence_score, created_at
        FROM ai_recommendations
        WHERE user_id = ? AND recommendation_type = ? 
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const cached = await databaseConfig.executeQuery(cacheQuery, [userId, type]);
      
      if (cached.length > 0) {
        return {
          data: JSON.parse(cached[0].recommendation_data),
          confidenceScore: cached[0].confidence_score,
          cachedAt: cached[0].created_at,
          fromCache: true
        };
      }

      return null;

    } catch (error) {
      console.error('AI recommendation cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Generate compelling product description using AI
   * @param {Object} productData - Basic product information
   * @returns {Promise<string>} AI-generated description
   */
  async generateProductDescription(productData) {
    try {
      const prompt = `
Create a compelling, professional investment product description for:

Product Name: ${productData.name}
Investment Type: ${productData.investmentType}
Annual Yield: ${productData.annualYield}%
Risk Level: ${productData.riskLevel}
Tenure: ${productData.tenureMonths} months
Minimum Investment: ₹${productData.minInvestment?.toLocaleString('en-IN') || 'N/A'}
Issuer: ${productData.issuer || 'Premium Financial Institution'}

Key Features to Highlight:
- ${productData.taxBenefits ? 'Tax benefits available' : 'Standard tax treatment'}
- ${productData.liquidityLevel || 'Medium'} liquidity level
- Compound frequency: ${productData.compoundFrequency || 'annually'}

Create a description that:
1. Explains the investment opportunity clearly
2. Highlights key benefits and features
3. Mentions the target investor profile
4. Maintains professional, trustworthy tone
5. Is 150-250 words
6. Avoids overly promotional language
7. Includes risk disclosure

Focus on helping investors understand the product and make informed decisions.
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return response?.trim() || null;

    } catch (error) {
      console.error('AI product description generation error:', error);
      return null;
    }
  }

  /**
   * Generate personalized product recommendations using AI
   * @param {Object} userProfile - User profile data
   * @param {Array} availableProducts - Available products for recommendation
   * @returns {Promise<Object>} AI-powered recommendations
   */
  async generateProductRecommendations(userProfile, availableProducts = []) {
    try {
      const prompt = `
Analyze this user profile and generate personalized investment product recommendations:

User Profile:
- Risk Appetite: ${userProfile.riskAppetite}
- Account Balance: ₹${userProfile.accountBalance?.toLocaleString('en-IN') || 'N/A'}
- Investment Experience: ${userProfile.totalInvestments || 0} previous investments
- Average Investment Size: ₹${userProfile.avgInvestmentAmount?.toLocaleString('en-IN') || 'N/A'}
- Member Since: ${userProfile.memberSince ? new Date(userProfile.memberSince).getFullYear() : 'Recent'}

Available Products Summary:
${availableProducts.slice(0, 10).map(product => 
  `- ${product.name}: ${product.annualYield}% yield, ${product.riskLevel} risk, ${product.tenureMonths}m tenure`
).join('\n')}

Provide recommendations in JSON format:
{
  "topRecommendations": [
    {
      "productId": "id",
      "reason": "Why this product suits the user",
      "matchScore": 0.85,
      "suggestedAmount": 25000,
      "timeline": "short/medium/long term"
    }
  ],
  "portfolioStrategy": "Diversification strategy for this user",
  "riskAnalysis": "Risk assessment and recommendations",
  "investmentTips": ["tip1", "tip2", "tip3"],
  "reasoning": "Overall recommendation rationale"
}

Focus on:
1. Risk-appropriate recommendations
2. Diversification benefits
3. User's financial capacity
4. Investment timeline considerations
5. Specific, actionable advice
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.4
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      const aiRecommendations = JSON.parse(response);
      
      // Cache the recommendations
      await this.cacheAIRecommendation(
        userProfile.id, 
        'product_recommendations', 
        aiRecommendations, 
        0.85
      );

      return aiRecommendations;

    } catch (error) {
      console.error('AI product recommendations error:', error);
      return null;
    }
  }

  /**
   * Analyze market trends and predict yields using AI
   * @param {Array} products - Product data for analysis
   * @param {Object} marketData - Additional market context
   * @returns {Promise<Object>} Market analysis and predictions
   */
  async analyzeMarketTrends(products, _marketData = {}) {
    try {
      const productSummary = products.map(p => ({
        type: p.investmentType,
        yield: p.annualYield,
        risk: p.riskLevel,
        popularity: p.statistics?.totalInvestments || 0
      }));

      const prompt = `
Analyze current investment market trends based on this data:

Product Performance:
${productSummary.slice(0, 20).map(p => 
  `${p.type.toUpperCase()}: ${p.yield}% yield, ${p.risk} risk, ${p.popularity} investments`
).join('\n')}

Current Market Context:
- Analysis Date: ${new Date().toLocaleDateString()}
- Total Products Analyzed: ${products.length}
- Market Segment: Indian Investment Products

Provide analysis in JSON format:
{
  "marketTrend": "bullish/bearish/stable",
  "yieldPredictions": {
    "bond": {"current": 7.2, "predicted": 7.5, "confidence": 0.8},
    "fd": {"current": 6.8, "predicted": 7.0, "confidence": 0.9},
    "mf": {"current": 12.5, "predicted": 13.2, "confidence": 0.6},
    "etf": {"current": 10.8, "predicted": 11.5, "confidence": 0.7}
  },
  "riskAssessment": "Current risk levels and recommendations",
  "investmentStrategy": "Suggested investment approach for next 6 months",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "warnings": ["warning1", "warning2"] if any,
  "confidenceLevel": 0.75
}

Consider:
1. Interest rate environment
2. Economic indicators
3. Risk-return relationships
4. Liquidity preferences
5. Regulatory changes impact
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.3
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('AI market trends analysis error:', error);
      return {
        marketTrend: 'stable',
        yieldPredictions: {},
        riskAssessment: 'Unable to analyze current market risks',
        investmentStrategy: 'Maintain diversified portfolio',
        keyInsights: ['Market analysis temporarily unavailable'],
        warnings: [],
        confidenceLevel: 0.0
      };
    }
  }

  /**
   * Generate product comparison analysis using AI
   * @param {Array} products - Products to compare
   * @param {Object} userContext - User context for personalization
   * @returns {Promise<Object>} Detailed comparison analysis
   */
  async generateProductComparison(products, userContext = {}) {
    try {
      if (products.length < 2) {
        throw new Error('At least 2 products required for comparison');
      }

      const productDetails = products.map(p => ({
        name: p.name,
        type: p.investmentType,
        yield: p.annualYield,
        risk: p.riskLevel,
        tenure: p.tenureMonths,
        minInvestment: p.minInvestment,
        features: {
          taxBenefits: p.taxBenefits,
          liquidity: p.liquidityLevel,
          compounding: p.compoundFrequency
        }
      }));

      const prompt = `
Compare these investment products for a user with ${userContext.riskAppetite || 'moderate'} risk appetite:

Products to Compare:
${productDetails.map((p, i) => `
${i + 1}. ${p.name}
   - Type: ${p.type}, Yield: ${p.yield}%, Risk: ${p.risk}
   - Tenure: ${p.tenure} months, Min: ₹${p.minInvestment?.toLocaleString('en-IN')}
   - Tax Benefits: ${p.features.taxBenefits ? 'Yes' : 'No'}
   - Liquidity: ${p.features.liquidity}, Compounding: ${p.features.compounding}
`).join('')}

Provide detailed comparison in JSON format:
{
  "overallRecommendation": "Which product is best and why",
  "detailedComparison": {
    "returns": "Yield comparison analysis",
    "risk": "Risk level analysis",
    "liquidity": "Liquidity comparison",
    "taxEfficiency": "Tax benefits analysis",
    "suitability": "User suitability analysis"
  },
  "prosAndCons": {
    "product1": {"pros": ["pro1", "pro2"], "cons": ["con1", "con2"]},
    "product2": {"pros": ["pro1", "pro2"], "cons": ["con1", "con2"]}
  },
  "scenarios": {
    "conservative": "Best choice for conservative investors",
    "aggressive": "Best choice for aggressive investors",
    "balanced": "Best choice for balanced investors"
  },
  "decisionMatrix": "Scoring matrix for decision making",
  "finalVerdict": "Clear recommendation with reasoning"
}
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.4
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('AI product comparison error:', error);
      return {
        overallRecommendation: 'Unable to generate comparison',
        detailedComparison: {},
        prosAndCons: {},
        scenarios: {},
        decisionMatrix: 'Comparison analysis unavailable',
        finalVerdict: 'Please compare products manually'
      };
    }
  }

  /**
   * Generate investment strategy suggestions using AI
   * @param {Object} userProfile - Complete user profile
   * @param {Object} portfolioData - Current portfolio information
   * @returns {Promise<Object>} AI-generated investment strategy
   */
  async generateInvestmentStrategy(userProfile, portfolioData = {}) {
    try {
      const prompt = `
Create a personalized investment strategy for this user:

User Profile:
- Age Group: ${this.calculateAgeGroup(userProfile.dateOfBirth)}
- Risk Appetite: ${userProfile.riskAppetite}
- Account Balance: ₹${userProfile.accountBalance?.toLocaleString('en-IN') || 'N/A'}
- Investment Experience: ${portfolioData.totalInvestments || 0} investments
- Current Portfolio Value: ₹${portfolioData.portfolioValue?.toLocaleString('en-IN') || '0'}
- Average Return: ${portfolioData.avgReturns || 0}%

Current Portfolio Distribution:
${portfolioData.distribution ? Object.entries(portfolioData.distribution)
  .map(([type, percentage]) => `- ${type}: ${percentage}%`).join('\n') : 'No current investments'}

Generate strategy in JSON format:
{
  "strategyType": "conservative/balanced/aggressive",
  "recommendedAllocation": {
    "bonds": 30,
    "fd": 40,
    "mf": 20,
    "etf": 10
  },
  "monthlyInvestmentPlan": {
    "suggestedAmount": 15000,
    "frequency": "monthly/quarterly",
    "sipRecommendations": ["product1", "product2"]
  },
  "timeHorizonStrategy": {
    "shortTerm": "1-3 years strategy",
    "mediumTerm": "3-7 years strategy",
    "longTerm": "7+ years strategy"
  },
  "riskMitigation": "Risk management recommendations",
  "rebalancingSchedule": "When and how to rebalance",
  "emergencyFundAdvice": "Emergency fund recommendations",
  "taxOptimization": "Tax saving strategies",
  "keyMilestones": ["milestone1", "milestone2", "milestone3"],
  "actionPlan": ["action1", "action2", "action3"]
}
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.5
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      const strategy = JSON.parse(response);
      
      // Cache the strategy
      await this.cacheAIRecommendation(
        userProfile.id, 
        'investment_strategy', 
        strategy, 
        0.8
      );

      return strategy;

    } catch (error) {
      console.error('AI investment strategy generation error:', error);
      return {
        strategyType: 'balanced',
        recommendedAllocation: { bonds: 25, fd: 35, mf: 25, etf: 15 },
        monthlyInvestmentPlan: { suggestedAmount: 10000, frequency: 'monthly' },
        timeHorizonStrategy: {},
        riskMitigation: 'Diversify across asset classes',
        actionPlan: ['Start with low-risk products', 'Gradually increase allocation']
      };
    }
  }

  /**
   * Calculate age group from date of birth
   * @param {string} dateOfBirth - Date of birth
   * @returns {string} Age group
   */
  calculateAgeGroup(dateOfBirth) {
    if (!dateOfBirth) return 'unknown';
    
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    
    if (age < 25) return 'young_adult';
    if (age < 35) return 'early_career';
    if (age < 50) return 'mid_career';
    if (age < 65) return 'pre_retirement';
    return 'retirement';
  }

  /**
   * Generate AI-powered portfolio optimization suggestions
   * @param {Object} currentPortfolio - Current portfolio data
   * @param {Object} userGoals - User investment goals
   * @returns {Promise<Object>} Portfolio optimization recommendations
   */
  async optimizePortfolio(currentPortfolio, userGoals = {}) {
    try {
      const prompt = `
Analyze and optimize this investment portfolio:

Current Portfolio:
- Total Value: ₹${currentPortfolio.totalValue?.toLocaleString('en-IN') || 'N/A'}
- Total Investments: ${currentPortfolio.totalInvestments || 0}
- Current Returns: ${currentPortfolio.totalReturns || 0}%
- Risk Score: ${currentPortfolio.riskScore || 'N/A'}/10

Asset Allocation:
${currentPortfolio.allocation ? Object.entries(currentPortfolio.allocation)
  .map(([asset, data]) => `- ${asset}: ₹${data.value?.toLocaleString('en-IN')} (${data.percentage}%)`).join('\n') : 'No allocation data'}

User Goals:
- Target Return: ${userGoals.targetReturn || 'Not specified'}%
- Investment Horizon: ${userGoals.timeHorizon || 'Not specified'}
- Risk Tolerance: ${userGoals.riskTolerance || 'Not specified'}

Provide optimization in JSON format:
{
  "currentAnalysis": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "riskAssessment": "Risk level analysis",
    "diversificationScore": 0.75
  },
  "optimizationSuggestions": {
    "reallocation": {
      "bonds": {"current": 30, "suggested": 25, "reason": "why"},
      "fd": {"current": 40, "suggested": 35, "reason": "why"}
    },
    "newInvestments": ["product1", "product2"],
    "exitSuggestions": ["product1 if any"],
    "sipAdjustments": "SIP modifications"
  },
  "expectedImpact": {
    "returnImprovement": "+2.5%",
    "riskReduction": "-1.2 risk points",
    "timeToGoal": "reduced by 8 months"
  },
  "implementationPlan": ["step1", "step2", "step3"],
  "monitoringSchedule": "Quarterly review recommended"
}
`;

      let response;
      
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: process.env.AI_MODEL || AI_MODELS.OPENAI_GPT3,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.4
        });
        
        response = completion.choices[0].message.content;
      } else if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('AI portfolio optimization error:', error);
      return {
        currentAnalysis: { strengths: [], weaknesses: [], riskAssessment: 'Analysis unavailable' },
        optimizationSuggestions: { reallocation: {}, newInvestments: [] },
        expectedImpact: {},
        implementationPlan: ['Portfolio optimization temporarily unavailable']
      };
    }
  }
}

module.exports = new AIService();