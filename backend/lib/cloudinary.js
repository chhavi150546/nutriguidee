/**
 * lib/cloudinary.js — Cloudinary SDK configuration
 *
 * WHAT IS CLOUDINARY?
 *   A cloud service that stores, transforms, and serves images/videos.
 *   You upload a file → Cloudinary gives back a permanent HTTPS URL.
 *   No need to store images on your server's disk.
 *
 * FLOW:
 *   Client             →  Express (Multer)  →  Cloudinary  →  MongoDB
 *   multipart/form-data   buffer in memory     stores file     saves URL
 *
 * CONCEPTS:
 *   v2.config()      — authenticates the SDK with your account credentials
 *   uploader.upload()— uploads a file (Buffer, filepath, URL, base64, stream)
 *   folder           — organises uploads into folders in your Cloudinary account
 *   resource_type    — "image" | "video" | "raw" | "auto"
 *   transformation   — resize/crop on upload (no extra request needed)
 *
 * HOW TO GET CREDENTIALS:
 *   1. Sign up at cloudinary.com (free tier: 25GB storage, 25GB bandwidth/month)
 *   2. Go to Dashboard → copy Cloud Name, API Key, API Secret
 *   3. Add them to your .env
 */

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,   // always use HTTPS URLs
});

/**
 * uploadBuffer — upload a raw Buffer to Cloudinary.
 *
 * Multer stores the file in memory as a Buffer (req.file.buffer).
 * Cloudinary's uploader.upload() expects a filepath or base64 string,
 * so we wrap it in a Promise and use upload_stream for Buffer support.
 *
 * @param {Buffer} buffer       raw file bytes from Multer
 * @param {string} folder       Cloudinary folder to organise uploads
 * @param {string} publicId     optional stable filename (overrides random name)
 * @returns {Promise<object>}   Cloudinary upload result ({ secure_url, public_id, ... })
 */
function uploadBuffer(buffer, folder = "nutriguide", publicId = undefined) {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "image",
      // Resize to max 400x400, cropped to a square — perfect for avatars
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      ...(publicId && { public_id: publicId, overwrite: true }),
    };

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    stream.end(buffer);   // pipe the Buffer into the upload stream
  });
}

/**
 * deleteImage — remove an image from Cloudinary by its public_id.
 * Call this when a user replaces or removes their avatar to avoid orphaned files.
 *
 * @param {string} publicId   e.g. "nutriguide/avatars/user_abc123"
 */
async function deleteImage(publicId) {
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, uploadBuffer, deleteImage };
