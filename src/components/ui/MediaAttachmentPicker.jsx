import React, { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, FileText, X, AlertCircle } from 'lucide-react';
import { validateMediaFile, uploadMediaAttachment, MAX_ATTACHMENTS_PER_POST } from '../../services/mediaStorageService';
import { TracewiseBubbleIconButton } from './BubbleActions';

export function MediaAttachmentPicker({
  attachments = [],
  onChange,
  userId = null,
  disabled = false,
  maxAttachments = MAX_ATTACHMENTS_PER_POST
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Clear input value so same file can be selected again if removed
    e.target.value = '';
    setErrorMessage(null);

    const remainingSlots = maxAttachments - attachments.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum ${maxAttachments} attachments allowed per post.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    // Validate each file
    for (const f of filesToUpload) {
      const check = validateMediaFile(f);
      if (!check.valid) {
        setErrorMessage(check.error);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const uploadedResults = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const f = filesToUpload[i];
        const res = await uploadMediaAttachment(f, userId, {
          onProgress: (p) => setUploadProgress(Math.round(((i + (p / 100)) / filesToUpload.length) * 100))
        });
        uploadedResults.push(res);
      }

      onChange([...attachments, ...uploadedResults]);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to attach file.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = attachments.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={disabled || uploading || attachments.length >= maxAttachments}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= maxAttachments}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: attachments.length >= maxAttachments ? 'rgba(255,255,255,0.3)' : '#cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: attachments.length >= maxAttachments ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => {
            if (attachments.length < maxAttachments) {
              e.currentTarget.style.backgroundColor = 'rgba(45, 197, 233, 0.15)';
              e.currentTarget.style.color = '#38bdf8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = attachments.length >= maxAttachments ? 'rgba(255,255,255,0.3)' : '#cbd5e1';
          }}
          aria-label="Add media attachment"
        >
          <Paperclip size={14} />
          <span>Attach (Images, PDF)</span>
          <span style={{ fontSize: '0.74rem', opacity: 0.6 }}>
            ({attachments.length}/{maxAttachments})
          </span>
        </button>

        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#38bdf8' }}>
            <span>Uploading... {uploadProgress}%</span>
            <div style={{ width: '60px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#2dc5e9', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Preview Grid */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
          {attachments.map((att, idx) => (
            <div
              key={att.id || idx}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: att.type === 'image' ? '4px' : '6px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(7, 24, 49, 0.85)',
                border: '1px solid rgba(74, 167, 242, 0.3)',
                maxWidth: '220px'
              }}
            >
              {att.type === 'image' && att.url ? (
                <img
                  src={att.url}
                  alt={att.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(45, 197, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dc5e9' }}>
                  <FileText size={18} />
                </div>
              )}

              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {(att.size / 1024).toFixed(0)} KB
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '4px'
                }}
                aria-label={`Remove attachment ${att.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
