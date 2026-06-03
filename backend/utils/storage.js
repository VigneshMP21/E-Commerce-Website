const supabase = require('../config/supabase');
const { AppError } = require('./errors');

const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

const sanitizePathPart = (value = 'image') => (
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image'
);

const createStorageFileName = (originalName, folder = '') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const fileName = `${timestamp}-${random}-${sanitizePathPart(originalName)}`;
  const cleanFolder = String(folder || '')
    .split('/')
    .map(sanitizePathPart)
    .filter(Boolean)
    .join('/');

  return cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
};

const uploadImageToSupabase = async (file, options = {}) => {
  if (!file?.buffer) {
    throw new AppError('Image file buffer is required', 400);
  }

  const bucket = options.bucket || DEFAULT_BUCKET;
  const fileName = createStorageFileName(file.originalname, options.folder);
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new AppError(`Supabase upload failed: ${uploadError.message}`, 500);
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new AppError('Unable to get uploaded image public URL', 500);
  }

  return {
    url: data.publicUrl,
    filename: fileName,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

const getStoragePathFromPublicUrl = (publicUrl, bucket = DEFAULT_BUCKET) => {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
};

const deleteImageFromSupabase = async (publicUrl, options = {}) => {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const fileName = getStoragePathFromPublicUrl(publicUrl, bucket);

  if (!fileName) return false;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    throw new AppError(`Supabase delete failed: ${error.message}`, 500);
  }

  return true;
};

module.exports = { uploadImageToSupabase, deleteImageFromSupabase };
