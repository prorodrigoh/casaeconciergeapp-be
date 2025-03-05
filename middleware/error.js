const { formatErrorResponse } = require("../utils/errorHandler");
const winston = require("winston");

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const errorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    // Handle malformed JSON
    logger.error("Malformed JSON request", {
      error: err.message,
      path: req.path,
    });
    return res
      .status(400)
      .json(formatErrorResponse(new ApiError(400, "Invalid JSON payload")));
  }

  // Log the error
  logger.error("Server error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send formatted response
  res.status(err.status || 500).json(formatErrorResponse(err));
};

module.exports = errorHandler;
