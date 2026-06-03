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

module.exports = { uploadImageToSupabase };
