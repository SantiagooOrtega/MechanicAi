const errorHandler = (err, req, res, next) => {
  console.error(`Error [${req.method} ${req.path}]:`, err.message);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.', code: 'DUPLICATE_ENTRY' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor.'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
};

/** Crea un error con código HTTP y código de aplicación */
const createError = (message, statusCode = 400, code = 'ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

module.exports = { errorHandler, createError };
