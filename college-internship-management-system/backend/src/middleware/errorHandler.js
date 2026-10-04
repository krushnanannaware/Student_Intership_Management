const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size exceeds 5MB limit" });
  }
  if (err.message === "Only PDF files are allowed for resumes") {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
};
module.exports = errorHandler;
