const fs = require('fs');
const path = require('path');

// TODO(security): Standard file upload malware scanning not implemented in this lightweight setup.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, fileType, base64 } = req.body;

  if (!base64 || !filename || !fileType) {
    return res.status(400).json({ error: 'Missing required fields: base64, filename, fileType' });
  }

  // Define allowed types
  const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

  // Validate MIME type
  if (!allowedMimes.includes(fileType)) {
    return res.status(400).json({ error: 'Invalid file MIME type. Only PNG, JPEG, GIF, and WEBP images are allowed.' });
  }

  // Validate extension using path.basename to prevent traversal
  const safeFilename = path.basename(filename);
  const ext = path.extname(safeFilename).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ error: 'Invalid file extension. Only .png, .jpg, .jpeg, .gif, and .webp are allowed.' });
  }

  // Parse base64 data URL
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let dataBuffer;
  let rawBase64 = base64;

  if (matches && matches.length === 3) {
    rawBase64 = matches[2];
    dataBuffer = Buffer.from(rawBase64, 'base64');
  } else {
    dataBuffer = Buffer.from(base64, 'base64');
  }

  // Enforce size limit (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (dataBuffer.length > MAX_SIZE) {
    return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
  }

  const apiKey = process.env.IMGBB_API_KEY;

  if (apiKey) {
    // CDN Option: Upload to ImgBB
    try {
      const formData = new URLSearchParams();
      formData.append('image', rawBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const result = await response.json();

      if (result && result.success && result.data && result.data.url) {
        return res.status(200).json({ status: 'success', url: result.data.url });
      } else {
        const errorMsg = result && result.error && result.error.message ? result.error.message : 'Unknown ImgBB API error';
        console.error('ImgBB upload error:', errorMsg);
        return res.status(400).json({ error: 'ImgBB Upload Failed: ' + errorMsg });
      }
    } catch (err) {
      console.error('Failed uploading to ImgBB:', err);
      return res.status(500).json({ error: 'Network error while contacting ImgBB.' });
    }
  }

  // Local Storage Option (Fallback/Local Dev) - Only reached if NO apiKey is provided
  if (process.env.VERCEL || process.env.JSONBIN_API_KEY) {
    return res.status(400).json({
      error: 'Image Upload Failed: IMGBB_API_KEY is not configured in your Vercel Environment Variables. Local file storage is not supported in production.'
    });
  }

  try {
    const imagesDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Generate unique safe name
    const uniqueName = `img_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    const localPath = path.join(imagesDir, uniqueName);

    fs.writeFileSync(localPath, dataBuffer);

    // Return relative url served by server.js
    const relativeUrl = `/images/${uniqueName}`;
    return res.status(200).json({ status: 'success', url: relativeUrl });
  } catch (err) {
    console.error('Local file write error:', err);
    return res.status(500).json({ error: 'Internal server error while saving file. (Note: Vercel does not support local uploads without an ImgBB key)' });
  }
};
