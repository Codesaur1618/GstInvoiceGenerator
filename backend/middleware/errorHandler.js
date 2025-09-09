// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    error.status = 400;
    error.message = 'Database operation failed';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation failed';
  }

  // Duplicate key errors
  if (err.code === '23505') {
    error.status = 409;
    error.message = 'Resource already exists';
  }

  // Foreign key constraint errors
  if (err.code === '23503') {
    error.status = 400;
    error.message = 'Referenced resource does not exist';
  }

  // Not found errors
  if (err.status === 404) {
    error.message = 'Resource not found';
  }

  // Send error response
  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

module.exports = { errorHandler };
