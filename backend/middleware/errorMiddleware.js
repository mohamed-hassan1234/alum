function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Mongo duplicate key
  if (err && err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    const fieldPart = fields.length ? ` (${fields.join(', ')})` : '';
    err.message = `Duplicate value${fieldPart}`;
  }

  // Mongoose casting errors (bad ObjectId, etc.)
  if (err && err.name === 'CastError') {
    statusCode = 400;
    err.message = 'Invalid identifier';
  }

  // Mongoose validation errors
  if (err && err.name === 'ValidationError') {
    statusCode = 400;
    err.message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
  }

  const isProd = process.env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    message: err.message || 'Server error',
    stack: isProd ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
