import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Copy,
  Check,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Upload,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  Cpu,
  Sliders,
  X
} from 'lucide-react';
import {
  TracewiseBubbleButton,
  TracewiseBubbleIconButton,
  TracewiseBubbleArea
} from '../ui/BubbleActions';
import {
  SUPPORTED_BOARDS,
  SUPPORTED_LANGUAGES,
  getBoardLanguageCapabilities
} from '../../domain/languageMatrix';

export function CodeEditor({
  code = '',
  onChange,
  onRunCheck,
  validationResults = [],
  project = null,
  onUpdateProject = null
}) {
  const [copied, setCopied] = useState(false);
  const [detectedPins, setDetectedPins] = useState([]);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [syntaxNotice, setSyntaxNotice] = useState(null);

  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);

  // Extract multi-files from project or fallback to single file
  const projectFiles = useMemo(() => {
    if (project?.firmware?.files && project.firmware.files.length > 0) {
      return project.firmware.files;
    }
    return [
      {
        path: project?.firmware?.mainFile || 'sketch.ino',
        content: code,
        language: project?.firmware?.language || 'arduino-cpp'
      }
    ];
  }, [project?.firmware?.files, project?.firmware?.mainFile, project?.firmware?.language, code]);

  const [activeFilePath, setActiveFilePath] = useState(projectFiles[0]?.path || 'sketch.ino');

  // Keep activeFilePath valid
  useEffect(() => {
    if (!projectFiles.some(f => f.path === activeFilePath)) {
      setActiveFilePath(projectFiles[0]?.path || 'sketch.ino');
    }
  }, [projectFiles, activeFilePath]);

  const activeFile = projectFiles.find(f => f.path === activeFilePath) || projectFiles[0] || {
    path: 'sketch.ino',
    content: code,
    language: 'arduino-cpp'
  };

  const currentCode = activeFile.content ?? code;

  // Active target board and language
  const targetBoard = project?.hardwarePlatform || project?.firmware?.targetBoard || 'Arduino Uno R3';
  const language = activeFile.path.endsWith('.py') ? 'micropython' : (project?.firmware?.language || 'arduino-cpp');

  const capabilities = useMemo(() => {
    return getBoardLanguageCapabilities(targetBoard, language);
  }, [targetBoard, language]);

  // Parse code for pins (Supports both Arduino C++ and MicroPython)
  useEffect(() => {
    const pins = [];
    // 1. C++ pinMode / digitalWrite regex
    const cppPinRegex = /(?:pinMode|digitalWrite|digitalRead|analogWrite|analogRead)\s*\(\s*([A-Za-z0-9_]+)/g;
    let match;
    while ((match = cppPinRegex.exec(currentCode)) !== null) {
      if (!pins.includes(match[1])) pins.push(match[1]);
    }
    // 2. Python Pin(X) / Pin(TRIG_PIN) regex
    const pyPinRegex = /Pin\s*\(\s*([A-Za-z0-9_]+)/g;
    while ((match = pyPinRegex.exec(currentCode)) !== null) {
      if (!pins.includes(match[1])) pins.push(match[1]);
    }
    setDetectedPins(pins);
  }, [currentCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleCodeChange = (newVal) => {
    if (onChange) {
      onChange(newVal, activeFile.path);
    }
  };

  // Add a new source file
  const handleCreateFile = () => {
    const raw = newFileName.trim();
    if (!raw) return;
    const cleanPath = raw.includes('.') ? raw : `${raw}.py`;

    if (projectFiles.some(f => f.path === cleanPath)) {
      alert('A file with this name already exists.');
      return;
    }

    const isPy = cleanPath.endsWith('.py');
    const newFile = {
      path: cleanPath,
      content: isPy
        ? `# ${cleanPath}\nimport time\n\nprint("Initialized ${cleanPath}")\n`
        : `// ${cleanPath}\n\nvoid setup() {\n}\n\nvoid loop() {\n}\n`,
      language: isPy ? 'python' : 'arduino-cpp'
    };

    if (onUpdateProject) {
      onUpdateProject(prev => ({
        ...prev,
        firmware: {
          ...(prev.firmware || {}),
          files: [...(prev.firmware?.files || projectFiles), newFile]
        }
      }));
    } else if (onChange) {
      onChange(newFile.content, newFile.path);
    }

    setActiveFilePath(cleanPath);
    setNewFileName('');
    setNewFileModalOpen(false);
  };

  // Delete a file
  const handleDeleteFile = (filePath, e) => {
    e.stopPropagation();
    if (projectFiles.length <= 1) {
      alert('Cannot delete the only source file in the project.');
      return;
    }
    if (!confirm(`Delete ${filePath}?`)) return;

    const remaining = projectFiles.filter(f => f.path !== filePath);
    if (onUpdateProject) {
      onUpdateProject(prev => ({
        ...prev,
        firmware: {
          ...(prev.firmware || {}),
          files: remaining
        }
      }));
    }
    if (activeFilePath === filePath) {
      setActiveFilePath(remaining[0].path);
    }
  };

  // File Upload
  const handleUploadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const isPy = file.name.endsWith('.py');
      const uploadedFile = {
        path: file.name,
        content: reader.result,
        language: isPy ? 'python' : 'arduino-cpp'
      };

      if (onUpdateProject) {
        onUpdateProject(prev => {
          const existing = (prev.firmware?.files || projectFiles).filter(f => f.path !== file.name);
          return {
            ...prev,
            firmware: {
              ...(prev.firmware || {}),
              files: [...existing, uploadedFile]
            }
          };
        });
      }
      setActiveFilePath(file.name);
    };
    reader.readAsText(file);
  };

  // Board change
  const handleBoardChange = (newBoardName) => {
    if (onUpdateProject) {
      onUpdateProject(prev => ({
        ...prev,
        hardwarePlatform: newBoardName,
        firmware: {
          ...(prev.firmware || {}),
          targetBoard: newBoardName
        }
      }));
    }
  };

  const lineCount = (currentCode.match(/\n/g) || []).length + 1;

  return (
    <TracewiseBubbleArea theme="dark">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#071831',
          color: '#f8fafc',
          fontFamily: 'var(--font-code)',
          overflow: 'hidden'
        }}
      >
        {/* Hardware & Language Capability Header Bar */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#081c38',
            borderBottom: '1px solid rgba(74, 167, 242, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            flexShrink: 0,
            gap: '10px'
          }}
        >
          {/* Target Board Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={14} color="#38bdf8" />
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Target:</span>
            <select
              value={targetBoard}
              onChange={(e) => handleBoardChange(e.target.value)}
              style={{
                backgroundColor: '#0a2348',
                border: '1px solid rgba(74, 167, 242, 0.3)',
                color: '#ffffff',
                fontSize: '0.76rem',
                borderRadius: '6px',
                padding: '3px 8px',
                outline: 'none'
              }}
            >
              {SUPPORTED_BOARDS.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Capability Disclosure Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {capabilities.simulationSupported ? (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                ✓ Simulation: Full AVR Execution
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fbbf24',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                title={capabilities.limitations?.[0] || 'Editing supported; local simulation unavailable'}
              >
                ✎ Editing & Syntax Checking Supported (Simulation Unsupported)
              </span>
            )}
          </div>
        </div>

        {/* Multi-File Tab Bar & Project Explorer Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0b2348',
            borderBottom: '1px solid rgba(74, 167, 242, 0.2)',
            flexShrink: 0
          }}
        >
          {/* File Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setShowFileExplorer(v => !v)}
              style={{
                padding: '8px 12px',
                backgroundColor: showFileExplorer ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                border: 'none',
                borderRight: '1px solid rgba(74, 167, 242, 0.15)',
                color: showFileExplorer ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.76rem',
                fontWeight: showFileExplorer ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
              title="Toggle Project Files Drawer (Overlay)"
              aria-label="Toggle Project Files"
            >
              <FolderOpen size={14} color={showFileExplorer ? '#38bdf8' : 'currentColor'} />
              <span>Files</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: showFileExplorer ? '#38bdf8' : 'rgba(148, 163, 184, 0.2)',
                  color: showFileExplorer ? '#071831' : '#cbd5e1',
                  fontWeight: 700
                }}
              >
                {projectFiles.length}
              </span>
            </button>

            {projectFiles.map(file => {
              const isActive = file.path === activeFilePath;
              return (
                <div
                  key={file.path}
                  onClick={() => setActiveFilePath(file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: isActive ? '#071831' : 'transparent',
                    borderRight: '1px solid rgba(74, 167, 242, 0.15)',
                    borderTop: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FileCode size={13} color={file.path.endsWith('.py') ? '#eab308' : '#38bdf8'} />
                  <span>{file.path}</span>
                  {projectFiles.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFile(file.path, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Close/Delete File"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setNewFileModalOpen(true)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Add New File"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          {/* Action buttons (Copy, Upload) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.74rem'
              }}
              title="Upload code file (.py, .ino, .cpp)"
            >
              <Upload size={13} />
              <input
                type="file"
                accept=".py,.ino,.cpp,.c,.h,.txt,.md"
                onChange={handleUploadFile}
                style={{ display: 'none' }}
              />
            </label>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Editor Main Body */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* Synchronized Line Numbers */}
          <div
            ref={lineNumbersRef}
            style={{
              width: '44px',
              padding: '12px 6px 56px 6px',
              backgroundColor: '#081e3d',
              color: '#64748b',
              fontSize: '0.84rem',
              lineHeight: '1.6',
              fontFamily: 'var(--font-code)',
              textAlign: 'right',
              userSelect: 'none',
              borderRight: '1px solid rgba(74, 167, 242, 0.12)',
              overflowY: 'hidden',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
            aria-hidden="true"
          >
            {[...Array(lineCount)].map((_, i) => (
              <div key={i} style={{ height: '1.6em', lineHeight: '1.6' }}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea Code Input (Full width, unobstructed) */}
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck="false"
            aria-label="Code Editor"
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              padding: '12px 14px 56px 14px',
              backgroundColor: 'transparent',
              color: '#f8fafc',
              fontSize: '0.84rem',
              lineHeight: '1.6',
              fontFamily: 'var(--font-code)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y pan-x',
              tabSize: 2,
              boxSizing: 'border-box'
            }}
          />

          {/* File Explorer Overlay Drawer (Slides in from the right over the editor) */}
          {showFileExplorer && (
            <>
              {/* Overlay Backdrop */}
              <div
                onClick={() => setShowFileExplorer(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(7, 24, 49, 0.4)',
                  backdropFilter: 'blur(1.5px)',
                  zIndex: 25,
                  cursor: 'pointer'
                }}
                title="Click to close files drawer"
              />

              {/* Slide-over Drawer Panel */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '240px',
                  maxWidth: '85%',
                  backgroundColor: '#06162d',
                  borderLeft: '1px solid rgba(74, 167, 242, 0.25)',
                  boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 30,
                  animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Drawer Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#081e3d',
                    borderBottom: '1px solid rgba(74, 167, 242, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen size={15} color="#38bdf8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                      PROJECT FILES
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}
                    >
                      {projectFiles.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFileExplorer(false)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title="Close Files Drawer"
                    aria-label="Close Files Drawer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Independent Scrollable File List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                  {projectFiles.map(file => {
                    const isActive = file.path === activeFilePath;
                    return (
                      <div
                        key={file.path}
                        onClick={() => setActiveFilePath(file.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          marginBottom: '6px',
                          borderRadius: '8px',
                          backgroundColor: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                          border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                          color: isActive ? '#38bdf8' : '#cbd5e1',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <FileCode size={14} color={file.path.endsWith('.py') ? '#eab308' : '#38bdf8'} />
                          <span style={{ fontWeight: isActive ? 700 : 400 }}>{file.path}</span>
                        </div>
                        {projectFiles.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFile(file.path, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete File"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Drawer Footer Actions */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(74, 167, 242, 0.15)', display: 'flex', gap: '8px', flexShrink: 0, backgroundColor: '#071831' }}>
                  <button
                    type="button"
                    onClick={() => setNewFileModalOpen(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>New File</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Bar: Detected Hardware Pins & Validation Action */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#081e3d',
            borderTop: '1px solid rgba(74, 167, 242, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            flexShrink: 0,
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', minWidth: 0 }}>
            <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>Hardware GPIOs:</span>
            {detectedPins.length > 0 ? (
              detectedPins.map((p) => (
                <span
                  key={p}
                  style={{
                    color: '#2dc5e9',
                    background: 'rgba(45, 197, 233, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {p}
                </span>
              ))
            ) : (
              <span style={{ color: '#64748b' }}>None</span>
            )}
          </div>

          <TracewiseBubbleButton
            onClick={onRunCheck}
            variant="accent"
            size="sm"
            style={{
              fontSize: '0.76rem',
              padding: '5px 12px',
              minHeight: '32px',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Play size={12} fill="#071831" />
            <span>Validate Code</span>
          </TracewiseBubbleButton>
        </div>

        {/* Modal: New File */}
        {newFileModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
            onClick={() => setNewFileModalOpen(false)}
          >
            <div
              style={{
                width: '320px',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#0a1f40',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>
                Create New Source File
              </h4>
              <input
                type="text"
                placeholder="e.g. motor_driver.py or helper.h"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#071831',
                  border: '1px solid rgba(74, 167, 242, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  marginBottom: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setNewFileModalOpen(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFile}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#38bdf8',
                    border: 'none',
                    color: '#071831',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TracewiseBubbleArea>
  );
}
