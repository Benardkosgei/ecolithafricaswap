const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    statusCode: 500,
    message: 'Internal Server Error'
  };

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.statusCode = 409;
    error.message = 'Duplicate entry - resource already exists';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.statusCode = 400;
    error.message = 'Referenced resource does not exist';
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    error.statusCode = 400;
    error.message = 'Data too long for field';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expired';
  }

  // Custom errors
  if (err.statusCode) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.statusCode = 413;
    error.message = 'File too large';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.statusCode = 400;
    error.message = 'Unexpected file field';
  }

  res.status(error.statusCode).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

module.exports = errorHandler;
