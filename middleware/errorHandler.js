const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  // Schema validation failed
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  // Bad ObjectId or wrong data type
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }
  // Duplicate value (unique index violation)
  if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  }

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };