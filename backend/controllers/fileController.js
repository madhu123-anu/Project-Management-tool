const cloudinary = require('cloudinary').v2;
const Task = require('../models/Task');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadFile = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `project-management/${taskId}`, resource_type: 'auto' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(req.file.buffer);
    });

    const attachment = {
      filename: req.file.originalname,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    };

    await Task.findByIdAndUpdate(taskId, { $push: { attachments: attachment } });
    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { taskId, publicId } = req.body;
    await cloudinary.uploader.destroy(publicId);
    await Task.findByIdAndUpdate(taskId, {
      $pull: { attachments: { publicId } }
    });
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
