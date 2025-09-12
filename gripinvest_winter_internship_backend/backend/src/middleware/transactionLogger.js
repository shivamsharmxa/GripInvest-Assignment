const { databaseConfig } = require('../config/database');
const { HTTP_METHODS } = require('../utils/constants');

const transactionLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody = null;
  let statusCode = null;
  
  // Override response methods to capture data
  res.send = function(body) {
    responseBody = body;
    statusCode = res.statusCode;
    return originalSend.call(this, body);
  };
  
  res.json = function(body) {
    responseBody = JSON.stringify(body);
    statusCode = res.statusCode;
    return originalJson.call(this, body);
  };
  
  // Continue to next middleware
  next();
  
  // Log after response is sent
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Extract user information if available
      const userId = req.user?.id || null;
      const userEmail = req.user?.email || null;
      
      // Get request details
      const endpoint = req.originalUrl || req.url;
      const httpMethod = req.method;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
      
      // Sanitize request body (remove sensitive data)
      let sanitizedRequestBody = null;
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyToLog = { ...req.body };
        // Remove sensitive fields
        delete bodyToLog.password;
        delete bodyToLog.password_hash;
        delete bodyToLog.current_password;
        delete bodyToLog.new_password;
        delete bodyToLog.confirm_password;
        delete bodyToLog.token;
        delete bodyToLog.otp;
        
        sanitizedRequestBody = JSON.stringify(bodyToLog);
      }
      
      // Sanitize response body (limit size and remove sensitive data)
      let sanitizedResponseBody = null;
      if (responseBody) {
        try {
          let parsedResponse = typeof responseBody === 'string' 
            ? JSON.parse(responseBody) 
            : responseBody;
          
          // Remove sensitive fields from response
          if (parsedResponse && typeof parsedResponse === 'object') {
            delete parsedResponse.password;
            delete parsedResponse.password_hash;
            delete parsedResponse.token;
            delete parsedResponse.refresh_token;
            delete parsedResponse.access_token;
          }
          
          const responseString = JSON.stringify(parsedResponse);
          // Limit response body size to 5000 characters
          sanitizedResponseBody = responseString.length > 5000 
            ? responseString.substring(0, 5000) + '...[truncated]'
            : responseString;
        } catch (parseError) {
          // If parsing fails, just truncate the original response
          sanitizedResponseBody = responseBody.length > 5000 
            ? responseBody.substring(0, 5000) + '...[truncated]'
            : responseBody;
        }
      }
      
      // Get error details if response indicates an error
      let errorMessage = null;
      let errorStack = null;
      if (statusCode >= 400) {
        try {
          const errorResponse = typeof responseBody === 'string' 
            ? JSON.parse(responseBody) 
            : responseBody;
          errorMessage = errorResponse?.message || errorResponse?.error || 'Unknown error';
        } catch (parseError) {
          errorMessage = 'Error parsing response';
        }
      }
      
      // Insert log into database
      const logQuery = `
        INSERT INTO transaction_logs (
          user_id, email, endpoint, http_method, status_code,
          request_body, response_body, user_agent, ip_address,
          execution_time_ms, error_message, error_stack, session_id,
          api_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const logParams = [
        userId,
        userEmail,
        endpoint.substring(0, 255), // Limit endpoint length
        httpMethod,
        statusCode || res.statusCode,
        sanitizedRequestBody,
        sanitizedResponseBody,
        userAgent.substring(0, 500), // Limit user agent length
        ipAddress?.substring(0, 45), // Limit IP address length
        executionTime,
        errorMessage,
        errorStack,
        req.sessionID || null,
        'v1',
      ];
      
      await databaseConfig.executeQuery(logQuery, logParams);
      
      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 ${httpMethod} ${endpoint} - ${statusCode} - ${executionTime}ms`);
        if (statusCode >= 400) {
          console.log(`❌ Error: ${errorMessage}`);
        }
      }
      
    } catch (error) {
      // Don't let logging errors affect the main application
      console.error('Transaction logging error:', error.message);
    }
  });
};

// Middleware to skip logging for certain endpoints
const skipLogging = (req, res, next) => {
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  return transactionLogger(req, res, next);
};

module.exports = skipLogging;