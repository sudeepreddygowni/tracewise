import React, { useState } from 'react';
import { X, Globe, Check, AlertCircle, Share2, Sparkles, Layers, Cpu, ShieldCheck } from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import { publishCommunityProject } from '../../services/communityService';

export function PublishProjectModal({
  isOpen,
  onClose,
  project,
  user,
  onProjectPublished
}) {
  const [title, setTitle] = useState(project?.name || 'My Electronic Circuit');
  const [description, setDescription] = useState(
    project?.description || 'A custom electronic circuit built and tested in Tracewise Studio.'
  );
  const [category, setCategory] = useState('Robotics');
  const [tagsInput, setTagsInput] = useState(
    (project?.components || []).map(c => c.name || c.type).slice(0, 3).join(', ')
  );
  const [coverUrl, setCoverUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const componentCount = (project?.components || []).length;
  const wireCount = (project?.connections || []).length;
  const mcu = (project?.components || []).find(c => c.type?.includes('arduino') || c.type?.includes('esp32'))?.name || 'Microcontroller';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user || user.isAnonymous) {
      setError('You must sign in with a registered account before publishing to the Community.');
      return;
    }

    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const published = await publishCommunityProject({
        projectId: project.id,
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.length > 0 ? tags : ['Arduino', 'Circuits'],
        coverUrl: coverUrl.trim() || null,
        projectData: {
          id: project.id,
          name: title.trim(),
          description: description.trim(),
          components: project.components || [],
          connections: project.connections || [],
          code: project.code || '',
          validation: project.validation || null,
          version: project.version || { id: 'v1.0', label: 'Published Release' }
        }
      }, user);

      setSuccess(true);
      if (onProjectPublished) {
        onProjectPublished(published);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to publish project to Community.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 24, 49, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <TracewiseBubbleArea theme="light">
        <div
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}
              >
                <Globe size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tw-text)', margin: 0 }}>
                  Publish to Community
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--tw-text-muted)' }}>
                  Showcase your circuit in Community Projects for other students to explore & remix
                </span>
              </div>
            </div>
            <TracewiseBubbleIconButton
              size="sm"
              variant="ghost"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </TracewiseBubbleIconButton>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                <span>Published successfully! Your project is now live in Community Projects.</span>
              </div>
            )}

            {/* Circuit Summary Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--tw-border)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="var(--tw-brand)" />
                <span style={{ fontWeight: 600, color: 'var(--tw-text)' }}>{mcu}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--tw-text-secondary)', fontSize: '0.78rem' }}>
                <span><b>{componentCount}</b> components</span>
                <span>•</span>
                <span><b>{wireCount}</b> wires</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. 4-Phase Traffic Light Controller"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--tw-border)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.86rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Robotics">Robotics</option>
                  <option value="Education">Education & Basics</option>
                  <option value="Automation">Home Automation & IoT</option>
                  <option value="Sensors">Sensors & Telemetry</option>
                  <option value="Audio">Audio & Tone</option>
                  <option value="Displays">Displays & Visuals</option>
                  <option value="General">General Maker</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Arduino, LED, Button"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--tw-border)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tw-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Project Description & How It Works
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what the circuit does, how to use it, and any key code logic..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--tw-border)',
                  fontSize: '0.86rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Author Attribution Notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '8px', fontSize: '0.76rem', color: '#1d4ed8' }}>
              <ShieldCheck size={16} />
              <span>
                Publishing as <b>{user?.displayName || 'Student Maker'}</b> (@{user?.handle || 'maker'}). Your original private studio copy remains intact and private.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <TracewiseBubbleButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </TracewiseBubbleButton>
              <TracewiseBubbleButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
              >
                <Share2 size={14} />
                <span>{isSubmitting ? 'Publishing...' : 'Publish to Community'}</span>
              </TracewiseBubbleButton>
            </div>
          </form>
        </div>
      </TracewiseBubbleArea>
    </div>
  );
}
