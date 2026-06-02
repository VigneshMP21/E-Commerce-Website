class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const REVIEW_IMAGE_SIZE_MESSAGE = 'Image is not supported because image size must be 1 MB or smaller.';
const REVIEW_IMAGE_TOTAL_SIZE_MESSAGE = 'Image is not supported because total review image size must be 3 MB or smaller.';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry found';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  if (
    err.code === 'ER_NET_PACKET_TOO_LARGE' ||
    err.errno === 1153 ||
    /max_allowed_packet|Got a packet bigger/i.test(err.message || '')
  ) {
    statusCode = 400;
    message = REVIEW_IMAGE_SIZE_MESSAGE;
  }

  if (err.type === 'entity.too.large') {
    statusCode = 400;
    message = REVIEW_IMAGE_TOTAL_SIZE_MESSAGE;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { AppError, errorHandler };
