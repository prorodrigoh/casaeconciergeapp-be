class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const formatErrorResponse = (error) => {
  return {
    status: error.status || 500,
    message: error.message || "Internal Server Error",
    details: error.details || null,
  };
};

module.exports = { ApiError, formatErrorResponse };
