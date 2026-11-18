import ImageKit from '@imagekit/nodejs';

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

// Verify if actual credentials (not placeholders) are present
export const isImageKitConfigured = Boolean(
  privateKey &&
  !privateKey.includes('your_') &&
  publicKey &&
  !publicKey.includes('your_') &&
  urlEndpoint &&
  !urlEndpoint.includes('your_')
);

let imagekitInstance = null;

if (isImageKitConfigured) {
  try {
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });

    // Convenience bindings
    if (imagekitInstance.helper?.getAuthenticationParameters) {
      imagekitInstance.getAuthenticationParameters = imagekitInstance.helper.getAuthenticationParameters.bind(
        imagekitInstance.helper
      );
    }
    if (imagekitInstance.files?.delete) {
      imagekitInstance.deleteFile = imagekitInstance.files.delete.bind(imagekitInstance.files);
    }
    if (imagekitInstance.files?.upload) {
      imagekitInstance.upload = imagekitInstance.files.upload.bind(imagekitInstance.files);
    }
    console.log('✅ ImageKit SDK successfully initialized with provided credentials.');
  } catch (error) {
    console.warn('⚠️ ImageKit initialization error:', error.message);
  }
} else {
  console.log(
    'ℹ️ ImageKit placeholder detected in .env. Falling back to local data-URI preview mode until live ImageKit keys are configured.'
  );
}

/**
 * Generate client-side authentication parameters for frontend uploads
 */
export const getAuthenticationParameters = (token, expire) => {
  if (isImageKitConfigured && imagekitInstance?.getAuthenticationParameters) {
    return {
      isMock: false,
      ...imagekitInstance.getAuthenticationParameters(token, expire)
    };
  }

  // Graceful development fallback
  return {
    isMock: true,
    token: token || 'mock-token-' + Date.now(),
    expire: expire || Math.floor(Date.now() / 1000) + 1800,
    signature: 'mock-signature-configure-imagekit-in-env'
  };
};

/**
 * Delete a file from ImageKit by fileId
 */
export const deleteFile = async (fileId) => {
  if (!fileId || fileId.startsWith('dev-file') || fileId.startsWith('local-file')) {
    return { message: 'Local/dev file ID skipped.' };
  }

  if (isImageKitConfigured && imagekitInstance?.deleteFile) {
    return await imagekitInstance.deleteFile(fileId);
  }

  return { message: 'ImageKit private key not configured; skipping remote delete' };
};

/**
 * Upload a file directly from server buffer
 */
export const uploadFile = async ({ file, fileName, folder = '/inventory', mimeType = 'image/jpeg' }) => {
  if (isImageKitConfigured && imagekitInstance?.upload) {
    return await imagekitInstance.upload({
      file, // buffer or base64
      fileName,
      folder
    });
  }

  // Graceful fallback for local development when credentials are placeholders
  const base64Data = typeof file === 'string' ? file : Buffer.from(file).toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    url: dataUrl,
    fileId: `dev-file-${Date.now()}`,
    name: fileName,
    thumbnailUrl: dataUrl
  };
};

export default imagekitInstance || {
  getAuthenticationParameters,
  deleteFile,
  uploadFile
};
