import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 (token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on failed login attempts
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * ImageKit Upload Helper:
 * 1. Calls GET /api/upload/auth to get secure upload authentication parameters (token, expire, signature).
 * 2. If real ImageKit credentials are configured, uploads directly to ImageKit CDN.
 * 3. Otherwise falls back to backend /api/upload (multer → data-URI).
 *
 * IMPORTANT: When posting multipart/form-data we must NOT let the axios instance
 * inject `Content-Type: application/json` — the browser must set it (with boundary).
 * We do this by deleting Content-Type from the per-request config so the browser
 * fills it in automatically.
 */
export const uploadImageToImageKit = async (file, folder = '/inventory') => {
  try {
    // 1. Fetch auth parameters from backend
    const { data: auth } = await api.get('/upload/auth');
    const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

    // 2. Use real ImageKit CDN upload only when credentials are properly configured
    const isRealImageKit =
      !auth.isMock &&
      publicKey &&
      !publicKey.includes('your_') &&
      auth.signature &&
      auth.signature !== 'mock-signature-configure-imagekit-in-env' &&
      auth.token &&
      auth.expire;

    if (isRealImageKit) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      formData.append('publicKey', publicKey);
      formData.append('signature', auth.signature);
      formData.append('expire', String(auth.expire));
      formData.append('token', auth.token);
      formData.append('folder', folder);

      // Direct POST to ImageKit — axios without our interceptor
      const ikResponse = await axios.post(
        'https://upload.imagekit.io/api/v1/files/upload',
        formData
        // No Content-Type header; browser sets multipart/form-data with boundary
      );

      return {
        url: ikResponse.data.url,
        fileId: ikResponse.data.fileId,
        name: ikResponse.data.name
      };
    }

    // 3. Fallback: send file to our own backend /api/upload (multer memory storage).
    //    We must let the browser set Content-Type (multipart/form-data + boundary).
    //    Delete the Content-Type that the axios instance would inject, then restore it.
    const backendFormData = new FormData();
    backendFormData.append('image', file);
    backendFormData.append('folder', folder);

    const backendResponse = await api.post('/upload', backendFormData, {
      headers: {
        // Setting to undefined tells axios to let the browser generate
        // the correct multipart/form-data; Content-Type with boundary
        'Content-Type': undefined
      },
      transformRequest: (data, headers) => {
        // Remove Content-Type so the browser sets it with boundary
        delete headers['Content-Type'];
        delete headers.common?.['Content-Type'];
        return data;
      }
    });

    return {
      url: backendResponse.data.url,
      fileId: backendResponse.data.fileId,
      name: backendResponse.data.name
    };
  } catch (error) {
    console.error('Image upload failed:', error?.response?.data || error.message);
    // Ultimate fallback: create a local object URL so UI previews still work
    const mockUrl = URL.createObjectURL(file);
    return {
      url: mockUrl,
      fileId: `local-file-${Date.now()}`,
      name: file.name
    };
  }
};

/**
 * Delete Image from ImageKit via backend
 */
export const deleteImageFromImageKit = async (fileId) => {
  if (!fileId || fileId.startsWith('local-file')) return null;
  return await api.delete(`/upload/${fileId}`);
};

export default api;
