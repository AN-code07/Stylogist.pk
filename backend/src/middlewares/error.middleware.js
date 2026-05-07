// src/middlewares/error.middleware.js
import { ApiError } from '../utils/ApiError.js';

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new ApiError(400, message);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new ApiError(400, message);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ApiError(400, message);
};

const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again.');
const handleJWTExpiredError = () => new ApiError(401, 'Your token has expired. Please log in again.');

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        // Programming or other unknown error: don't leak error details
    } else {
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

// Cloudinary's SDK rejects with `{ message, http_code, name }`. Wrap so
// the admin sees the real reason ("Invalid API key", "File too large",
// etc.) instead of the generic prod fallback.
const handleCloudinaryError = (err) => {
    const message = err?.message || err?.error?.message || 'Image upload failed';
    const status = Number(err?.http_code) || 500;
    return new ApiError(status, `Cloudinary: ${message}`);
};

const looksLikeCloudinaryError = (err) =>
    Boolean(err?.http_code || err?.error?.http_code || /cloudinary/i.test(err?.message || ''));

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = `${err.statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Always log non-operational errors so we can debug "Something went
    // very wrong" messages from the prod console — without this the
    // server stays silent and the cause is invisible.
    if (!err.isOperational) {
        // eslint-disable-next-line no-console
        console.error('[unhandled error]', err);
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.isOperational = err.isOperational;

        // Transform native Mongoose/JWT/Cloudinary errors into Operational ApiErrors
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        if (looksLikeCloudinaryError(err)) error = handleCloudinaryError(err);

        sendErrorProd(error, res);
    }
};