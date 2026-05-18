/**
 * controllers/profile.js
 *
 * Profile CRUD using MongoDB / Mongoose (L33-36).
 * Avatar upload uses Multer (multipart/form-data) + Cloudinary (image hosting).
 */

const Profile = require("../models/Profile");
const { uploadBuffer, deleteImage } = require("../lib/cloudinary");

// GET /api/profile
exports.get = async (req, res, next) => {
  try {
    let prof = await Profile.findOne({ userId: req.user.id });
    if (!prof) prof = await Profile.create({ userId: req.user.id });
    res.json({ profile: prof });
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile
exports.update = async (req, res, next) => {
  try {
    const { username, avatar_url, dietary_preference, daily_calorie_goal } = req.body;
    const prof = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { username, avatar_url, dietary_preference, daily_calorie_goal },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ profile: prof });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/avatar ──────────────────────────────────────────────────
//
// FLOW:
//   1. Client sends multipart/form-data with field name "avatar"
//   2. Multer (uploadAvatar middleware in the route) parses it → req.file.buffer
//   3. We upload the Buffer to Cloudinary → get back a secure_url
//   4. Save the URL (and public_id for future deletion) to Profile in MongoDB
//   5. Return the new avatar_url to the client
//
// WHY store public_id?
//   To delete the old image from Cloudinary when the user uploads a new one.
//   Without deletion, old images accumulate in your Cloudinary account.
//
exports.uploadAvatar = async (req, res, next) => {
  try {
    // req.file is set by Multer's uploadAvatar middleware
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Fetch current profile to get old cloudinary_public_id for cleanup
    const existing = await Profile.findOne({ userId: req.user.id });

    // Upload Buffer → Cloudinary
    // We use the user's MongoDB id as the public_id so re-uploads overwrite the same file
    const result = await uploadBuffer(
      req.file.buffer,
      "nutriguide/avatars",
      `user_${req.user.id}`    // stable public_id = always overwrites the same slot
    );

    // Delete old image only if it's a different public_id (e.g., previously uploaded without stable id)
    if (existing?.cloudinary_public_id && existing.cloudinary_public_id !== result.public_id) {
      await deleteImage(existing.cloudinary_public_id).catch(() => {});
    }

    // Save URL to MongoDB Profile
    const prof = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        avatar_url:           result.secure_url,
        cloudinary_public_id: result.public_id,
      },
      { new: true, upsert: true }
    );

    res.json({
      avatar_url: prof.avatar_url,
      profile:    prof,
    });
  } catch (err) {
    next(err);
  }
};
