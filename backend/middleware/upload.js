/**
 * middleware/upload.js — Multer configuration for file uploads
 *
 * WHAT IS MULTER?
 *   Express middleware that parses multipart/form-data requests
 *   (the encoding used when an HTML <input type="file"> submits a form).
 *   Without Multer, req.body is empty for file uploads.
 *
 * STORAGE OPTIONS:
 *   multer.diskStorage()    → saves files to disk (bad for cloud servers)
 *   multer.memoryStorage()  → holds files in memory as a Buffer
 *
 *   We use memoryStorage because:
 *     • Cloud servers (Render) have ephemeral disks — files disappear on restart
 *     • We immediately stream the Buffer to Cloudinary, so disk is never needed
 *
 * WHAT MULTER ADDS TO req:
 *   req.file          → single file upload (when using .single("fieldName"))
 *     .originalname   → original filename from the client
 *     .mimetype       → "image/jpeg", "image/png", etc.
 *     .size           → file size in bytes
 *     .buffer         → raw file bytes (only with memoryStorage)
 *
 *   req.files         → multiple files (when using .array() or .fields())
 *
 * SECURITY — fileFilter:
 *   Always validate file type server-side.
 *   Clients can lie about Content-Type, so we check the mimetype too.
 */

const multer = require("multer");

// ── Storage: memory (Buffer) — no disk write ──────────────────────────────────
const storage = multer.memoryStorage();

// ── File type validation ───────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);   // accept the file
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
}

// ── Multer instance — 2MB limit ───────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,   // 2 MB — prevents huge uploads
  },
});

// ── Named exports for common use cases ────────────────────────────────────────

// Single image field called "avatar"
//   usage: router.post("/avatar", uploadAvatar, controller)
const uploadAvatar = upload.single("avatar");

// Wrap Multer errors so our global error handler formats them as JSON
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // MulterError codes: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE, etc.
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large. Maximum size is 2MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

module.exports = { upload, uploadAvatar, handleMulterError };
