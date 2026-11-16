import React from 'react';

/**
 * Safe, zero-dependency Markdown renderer for Tracewise Chat.
 * Prevents arbitrary HTML injection while rendering clean headings, lists,
 * inline code, and horizontally-scrollable JetBrains Mono code blocks.
 */
export function SafeMarkdown({ content }) {
  if (!content) return null;

  const rawLines = String(content).split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check code fence
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div key={`codeblock-${i}`} style={{ margin: '8px 0', maxWidth: '100%' }}>
            {codeBlockLang && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: '#0a1a36',
                  padding: '4px 12px',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  fontFamily: 'var(--font-code, JetBrains Mono, monospace)'
                }}
              >
                {codeBlockLang}
              </div>
            )}
            <pre
              style={{
                backgroundColor: '#071831',
                color: '#e2e8f0',
                padding: '10px 14px',
                borderRadius: codeBlockLang ? '0 0 10px 10px' : '10px',
                margin: 0,
                fontSize: '0.78rem',
                lineHeight: 1.5,
                fontFamily: 'var(--font-code, JetBrains Mono, monospace)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`spacer-${i}`} style={{ height: '6px' }} />);
      continue;
    }

    // Headings (### or ##)
    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: '0.94rem',
            fontWeight: 700,
            color: 'inherit',
            margin: '8px 0 4px',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {formatInline(line.slice(4))}
        </h4>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            fontSize: '1.02rem',
            fontWeight: 800,
            color: 'inherit',
            margin: '10px 0 6px',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {formatInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Bullet points (• or - or *)
    const bulletMatch = line.match(/^(\s*)([•\-\*]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length * 10;
      const marker = bulletMatch[2];
      const text = bulletMatch[3];
      elements.push(
        <div
          key={`bullet-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginLeft: indent,
            margin: '3px 0',
            lineHeight: 1.5
          }}
        >
          <span style={{ color: 'var(--tw-brand)', fontWeight: 'bold', flexShrink: 0 }}>
            {marker === '•' || marker === '-' || marker === '*' ? '•' : marker}
          </span>
          <span style={{ flex: 1 }}>{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} style={{ margin: '4px 0', lineHeight: 1.55 }}>
        {formatInline(line)}
      </p>
    );
  }

  // Close unclosed code block if any
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="codeblock-tail"
        style={{
          backgroundColor: '#071831',
          color: '#e2e8f0',
          padding: '10px 14px',
          borderRadius: '10px',
          margin: '8px 0',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-code, JetBrains Mono, monospace)',
          overflowX: 'auto'
        }}
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
}

// Parse inline formatting: **bold**, `code`, and regular text
function formatInline(text) {
  if (!text) return null;

  // Split by inline code first: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={pIdx}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.07)',
            padding: '2px 5px',
            borderRadius: '5px',
            fontFamily: 'var(--font-code, JetBrains Mono, monospace)',
            fontSize: '0.85em',
            color: 'var(--tw-brand)',
            wordBreak: 'break-word'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Split by bold: **bold**
    const boldParts = part.split(/(\*\*[^\*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
        return <strong key={`${pIdx}-${bIdx}`}>{bPart.slice(2, -2)}</strong>;
      }
      return bPart;
    });
  });
}
