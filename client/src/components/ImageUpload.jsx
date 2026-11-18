import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadImageToImageKit, deleteImageFromImageKit } from '../services/api';

const ImageUpload = ({
  label = 'Upload Image',
  currentImageUrl = '',
  currentImageFileId = '',
  onUploadSuccess,
  folder = '/inventory'
}) => {
  const [preview, setPreview] = useState(currentImageUrl);
  const [fileId, setFileId] = useState(currentImageFileId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const result = await uploadImageToImageKit(file, folder);
      setPreview(result.url);
      setFileId(result.fileId);
      if (onUploadSuccess) {
        onUploadSuccess({
          url: result.url,
          fileId: result.fileId
        });
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (fileId) {
      try {
        await deleteImageFromImageKit(fileId);
      } catch (err) {
        console.warn('Error deleting image from ImageKit:', err);
      }
    }
    setPreview('');
    setFileId('');
    if (onUploadSuccess) {
      onUploadSuccess({
        url: '',
        fileId: ''
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label}
      </label>

      {preview ? (
        <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group">
          <img
            src={preview}
            alt="Upload preview"
            className="w-36 h-36 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[10px] py-1 px-2 text-center truncate">
            ImageKit uploaded
          </div>
        </div>
      ) : (
        <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-indigo-600 font-medium">Uploading to ImageKit...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  <span className="text-indigo-600 font-semibold">Click to upload</span> or drag & drop
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
