import { getAuthenticationParameters, deleteFile, uploadFile } from '../utils/imagekit.js';

/**
 * @desc    Get ImageKit client-side upload authentication parameters
 * @route   GET /api/upload/auth
 * @access  Public / Private (Permits Register page avatar upload)
 */
export const getUploadAuth = (req, res, next) => {
  try {
    const authParams = getAuthenticationParameters();
    res.status(200).json({
      success: true,
      ...authParams
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an image from ImageKit
 * @route   DELETE /api/upload/:fileId
 * @access  Private
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required.'
      });
    }

    const result = await deleteFile(fileId);
    res.status(200).json({
      success: true,
      message: 'Image deleted from ImageKit successfully.',
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct backend image upload to ImageKit (Fallback when credentials not set)
 * @route   POST /api/upload
 * @access  Public (open so registration page can upload without login)
 */
export const directUpload = async (req, res, next) => {
  try {
    // Validate file was actually received by multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'No file received. Make sure to send the image as form-data with field name "image" and Content-Type: multipart/form-data.'
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File buffer is empty. The uploaded file may be corrupted.'
      });
    }

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const folder = req.body?.folder || '/inventory';

    const uploadResponse = await uploadFile({
      file: req.file.buffer.toString('base64'),
      fileName,
      folder,
      mimeType: req.file.mimetype || 'image/jpeg'
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url
    });
  } catch (error) {
    console.error('[uploadController] directUpload error:', error.message);
    next(error);
  }
};
