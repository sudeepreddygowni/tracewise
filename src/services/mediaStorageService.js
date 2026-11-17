import { supabase, isSupabaseConfigured } from './supabase.js';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_ATTACHMENTS_PER_POST = 4;

/**
 * Validate a candidate file before uploading.
 * Checks MIME type, file extension, and file size.
 * Rejects executable, HTML, SVG, or active content.
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // 1. Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 5MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`
    };
  }

  // 2. Check extension
  const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type "${ext || 'unknown'}" is not supported. Please upload JPEG, PNG, WebP, or PDF.`
    };
  }

  // 3. Check declared MIME type
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format (${file.type}). Only JPEG, PNG, WebP, and PDF documents are allowed.`
    };
  }

  return { valid: true };
}

/**
 * Upload a media file to Supabase Storage with progress reporting.
 */
export async function uploadMediaAttachment(file, userId, { onProgress } = {}) {
  const check = validateMediaFile(file);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
  const sanitizedName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .slice(0, 80);

  const timestamp = Date.now();
  const filePath = `${userId || 'anon'}/${timestamp}_${sanitizedName}`;

  // Instant local preview URL
  const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;

  if (isSupabaseConfigured() && supabase) {
    try {
      if (onProgress) onProgress(20);

      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (onProgress) onProgress(80);

      if (error) {
        console.warn('Storage upload error, using local fallback:', error.message);
        // If storage bucket isn't available or fails, return preview object
        return {
          id: 'att-' + timestamp,
          name: file.name,
          size: file.size,
          mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
          type: isImage ? 'image' : 'pdf',
          url: localPreviewUrl || '',
          path: filePath
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(data.path);

      if (onProgress) onProgress(100);

      return {
        id: 'att-' + timestamp,
        name: file.name,
        size: file.size,
        mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
        type: isImage ? 'image' : 'pdf',
        url: urlData?.publicUrl || localPreviewUrl,
        path: data.path
      };
    } catch (err) {
      console.warn('Supabase storage upload note:', err.message);
      return {
        id: 'att-' + timestamp,
        name: file.name,
        size: file.size,
        mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
        type: isImage ? 'image' : 'pdf',
        url: localPreviewUrl || '',
        path: filePath
      };
    }
  }

  // Offline / local preview mode
  return {
    id: 'att-' + timestamp,
    name: file.name,
    size: file.size,
    mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
    type: isImage ? 'image' : 'pdf',
    url: localPreviewUrl || '',
    path: filePath
  };
}

/**
 * Delete a media attachment from storage.
 */
export async function deleteMediaAttachment(filePath) {
  if (!filePath || !isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.storage
      .from('community-media')
      .remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}
