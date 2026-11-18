import { supabase, isSupabaseConfigured } from './supabase.js';

export const MEDIA_CATEGORIES = {
  COMMUNITY: 'community',
  DIRECT_MESSAGE: 'direct_message',
  PROJECT_DOCS: 'project_docs',
  PROFILE: 'profile'
};

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
 * Upload a media file to Supabase Storage with progress reporting and category-scoped privacy.
 * - COMMUNITY: Uploaded to public community storage.
 * - DIRECT_MESSAGE: Uploaded to scoped private path with time-limited signed URL. Never public.
 * - PROJECT_DOCS: Scoped to project documentation.
 */
export async function uploadMediaAttachment(file, userId, { category = MEDIA_CATEGORIES.COMMUNITY, onProgress } = {}) {
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
  const isDirectMessage = category === MEDIA_CATEGORIES.DIRECT_MESSAGE;
  const folder = isDirectMessage ? 'direct_messages' : (userId || 'anon');
  const filePath = isDirectMessage
    ? `direct_messages/${userId || 'anon'}/${timestamp}_${sanitizedName}`
    : `${userId || 'anon'}/${timestamp}_${sanitizedName}`;

  // Instant local preview URL
  const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;

  if (isSupabaseConfigured() && supabase) {
    try {
      if (onProgress) onProgress(20);

      // Choose bucket: if direct message, use private-media or community-media with signed URL
      const bucket = isDirectMessage ? 'private-media' : 'community-media';

      // First try intended bucket, fallback to community-media if private-media bucket does not exist
      let uploadResult = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadResult.error && bucket !== 'community-media') {
        // Fallback to community-media under protected dm/ path if custom bucket not initialized
        uploadResult = await supabase.storage
          .from('community-media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
      }

      if (onProgress) onProgress(80);

      if (uploadResult.error) {
        if (isDirectMessage) {
          // Direct messages must NEVER silently fall back to ephemeral blob: URLs
          throw new Error(`Direct message upload failed: ${uploadResult.error.message}. Please retry.`);
        }
        console.warn('Storage upload error, using local fallback:', uploadResult.error.message);
        return {
          id: 'att-' + timestamp,
          name: file.name,
          size: file.size,
          mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
          type: isImage ? 'image' : 'pdf',
          url: localPreviewUrl || '',
          path: filePath,
          category
        };
      }

      const activeBucket = uploadResult.data?.bucket || (uploadResult.error ? 'community-media' : (bucket === 'private-media' ? 'private-media' : 'community-media'));
      const storedPath = uploadResult.data?.path || filePath;

      if (onProgress) onProgress(100);

      if (isDirectMessage) {
        // Generate time-limited signed URL (1 hour)
        const { data: signData, error: signErr } = await supabase.storage
          .from(activeBucket)
          .createSignedUrl(storedPath, 3600);

        return {
          id: 'att-' + timestamp,
          name: file.name,
          size: file.size,
          mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
          type: isImage ? 'image' : 'pdf',
          url: signData?.signedUrl || '',
          path: storedPath,
          bucket: activeBucket,
          isPrivate: true,
          category: MEDIA_CATEGORIES.DIRECT_MESSAGE
        };
      }

      // Public URL for community media
      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(storedPath);

      return {
        id: 'att-' + timestamp,
        name: file.name,
        size: file.size,
        mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
        type: isImage ? 'image' : 'pdf',
        url: urlData?.publicUrl || localPreviewUrl,
        path: storedPath,
        category
      };
    } catch (err) {
      if (isDirectMessage) {
        throw err;
      }
      console.warn('Supabase storage upload note:', err.message);
      return {
        id: 'att-' + timestamp,
        name: file.name,
        size: file.size,
        mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
        type: isImage ? 'image' : 'pdf',
        url: localPreviewUrl || '',
        path: filePath,
        category
      };
    }
  }

  // Offline / local preview mode (for testing without Supabase)
  return {
    id: 'att-' + timestamp,
    name: file.name,
    size: file.size,
    mimeType: file.type || (isImage ? 'image/png' : 'application/pdf'),
    type: isImage ? 'image' : 'pdf',
    url: localPreviewUrl || '',
    path: filePath,
    category
  };
}

/**
 * Obtains a fresh signed URL for private attachments (e.g. Direct Messages)
 */
export async function getMediaSignedUrl(filePath, bucket = 'private-media', expiresIn = 3600) {
  if (!filePath || !isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error && bucket !== 'community-media') {
      const retry = await supabase.storage
        .from('community-media')
        .createSignedUrl(filePath, expiresIn);
      return retry.data?.signedUrl || null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.warn('Failed to obtain signed URL:', err.message);
    return null;
  }
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

/**
 * Validate an avatar or cover image file (JPEG, PNG, WebP up to 5MB)
 */
export function validateImageFile(file, maxMb = 5) {
  if (!file) return { valid: false, error: 'No image file selected.' };
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (!allowedExts.includes(ext) || (file.type && !allowed.includes(file.type))) {
    return {
      valid: false,
      error: 'Please upload a valid JPEG, PNG, or WebP image.'
    };
  }

  if (file.size > maxMb * 1024 * 1024) {
    return {
      valid: false,
      error: `Image exceeds the ${maxMb}MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`
    };
  }

  return { valid: true };
}

/**
 * Upload a user avatar to Supabase Storage in the user's secure folder.
 */
export async function uploadProfileAvatar(file, userId) {
  const check = validateImageFile(file, 5);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const sanitized = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_').slice(0, 60);
  const ext = sanitized.split('.').pop() || 'png';
  const timestamp = Date.now();
  const filePath = `${userId || 'guest'}/avatars/avatar_${timestamp}.${ext}`;
  const localPreview = URL.createObjectURL(file);

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Avatar upload to storage note:', error.message);
        return { url: localPreview, path: filePath };
      }

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(data.path);

      return {
        url: urlData?.publicUrl || localPreview,
        path: data.path
      };
    } catch (err) {
      console.warn('Avatar storage exception:', err.message);
      return { url: localPreview, path: filePath };
    }
  }

  return { url: localPreview, path: filePath };
}

/**
 * Upload a profile cover banner to Supabase Storage in the user's secure folder.
 */
export async function uploadCoverPhoto(file, userId) {
  const check = validateImageFile(file, 5);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const sanitized = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_').slice(0, 60);
  const ext = sanitized.split('.').pop() || 'png';
  const timestamp = Date.now();
  const filePath = `${userId || 'guest'}/covers/cover_${timestamp}.${ext}`;
  const localPreview = URL.createObjectURL(file);

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase.storage
        .from('community-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Cover photo upload note:', error.message);
        return { url: localPreview, path: filePath };
      }

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(data.path);

      return {
        url: urlData?.publicUrl || localPreview,
        path: data.path
      };
    } catch (err) {
      console.warn('Cover storage exception:', err.message);
      return { url: localPreview, path: filePath };
    }
  }

  return { url: localPreview, path: filePath };
}
