// Centralised async error wrapper — eliminates try/catch boilerplate in every controller
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Global Express error-handler — mount LAST in server.js
export const globalErrorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} —`, err.message);

  // Postgres unique-violation
  if (err.code === '23505')
    return res.status(409).json({ message: 'Duplicate entry — record already exists.' });

  // Postgres foreign-key violation
  if (err.code === '23503')
    return res.status(400).json({ message: 'Referenced record does not exist.' });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};
