import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

export default function MarkdownRenderer({ content = '' }) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  const handleCopyCode = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Block-level parsing algorithm
  const parseMarkdownToReact = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let currentListType = null; // 'ul' or 'ol'
    let currentCodeBlock = null;
    let currentTable = null;

    const flushList = (key) => {
      if (currentList.length > 0) {
        if (currentListType === 'ul') {
          elements.push(
            <ul key={`ul-${key}`} className="list-disc pl-6 mb-4 space-y-1.5 dark:text-gray-300">
              {currentList.map((item, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineStyles(item) }} />
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-6 mb-4 space-y-1.5 dark:text-gray-300">
              {currentList.map((item, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineStyles(item) }} />
              ))}
            </ol>
          );
        }
        currentList = [];
        currentListType = null;
      }
    };

    const flushTable = (key) => {
      if (currentTable) {
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-5 rounded-xl border border-gray-200/10">
            <table className="min-w-full divide-y divide-gray-200/10 text-sm">
              <thead className="bg-gray-50/40 dark:bg-gray-900/40">
                <tr>
                  {currentTable.headers.map((th, idx) => (
                    <th key={idx} className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200/10">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/10">
                {currentTable.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-gray-600 dark:text-gray-300 border-r border-gray-200/10" dangerouslySetInnerHTML={{ __html: parseInlineStyles(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Code block handling
      if (line.trim().startsWith('```')) {
        if (currentCodeBlock) {
          // Closing code block
          const codeString = currentCodeBlock.codeLines.join('\n');
          const blockIdx = i;
          elements.push(
            <div key={`code-${i}`} className="relative group my-5 rounded-xl overflow-hidden border border-gray-700 bg-slate-900 shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-gray-800 text-xxs font-mono text-gray-400">
                <span>{currentCodeBlock.language.toUpperCase() || 'CODE'}</span>
                <button
                  onClick={() => handleCopyCode(codeString, blockIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedCodeIndex === blockIdx ? (
                    <>
                      <FiCheck className="text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <FiCopy /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm text-slate-100 font-mono leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
          currentCodeBlock = null;
        } else {
          // Starting code block
          flushList(i);
          flushTable(i);
          const language = line.trim().slice(3) || 'javascript';
          currentCodeBlock = { language, codeLines: [] };
        }
        continue;
      }

      if (currentCodeBlock) {
        currentCodeBlock.codeLines.push(line);
        continue;
      }

      // 2. Table handling
      if (line.trim().startsWith('|')) {
        flushList(i);
        const parts = line.split('|').map(p => p.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Skip separator rows (e.g. |---|---|)
        if (parts.every(p => p.startsWith('-') || p.startsWith(':'))) {
          continue;
        }

        if (!currentTable) {
          currentTable = { headers: parts, rows: [] };
        } else {
          currentTable.rows.push(parts);
        }
        continue;
      } else {
        if (currentTable) {
          flushTable(i);
        }
      }

      // 3. Lists handling
      const ulMatch = line.match(/^[\*\-]\s+(.+)$/);
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (ulMatch) {
        if (currentListType !== 'ul') {
          flushList(i);
          currentListType = 'ul';
        }
        currentList.push(ulMatch[1]);
        continue;
      } else if (olMatch) {
        if (currentListType !== 'ol') {
          flushList(i);
          currentListType = 'ol';
        }
        currentList.push(olMatch[2]);
        continue;
      } else {
        flushList(i);
      }

      // 4. Headers handling
      if (line.trim().startsWith('#')) {
        const headerLevel = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerLevel) {
          const depth = headerLevel[1].length;
          const text = headerLevel[2];
          const innerHtml = parseInlineStyles(text);

          if (depth === 1) {
            elements.push(<h1 key={i} className="font-display font-bold text-3xl md:text-4xl text-[rgb(var(--accent-color))] mt-6 mb-4" dangerouslySetInnerHTML={{ __html: innerHtml }} />);
          } else if (depth === 2) {
            elements.push(<h2 key={i} className="font-display font-bold text-2xl text-gray-800 dark:text-white mt-6 mb-3 border-b border-gray-200/10 pb-1.5" dangerouslySetInnerHTML={{ __html: innerHtml }} />);
          } else {
            elements.push(<h3 key={i} className="font-display font-semibold text-lg text-gray-700 dark:text-gray-200 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: innerHtml }} />);
          }
          continue;
        }
      }

      // 5. Blockquote / Alert callouts handling
      if (line.trim().startsWith('>')) {
        const blockquoteContent = line.replace(/^\>\s*/, '');
        
        // Detect alert types: [!IMPORTANT], [!NOTE], [!TIP], [!WARNING], [!CAUTION]
        const alertMatch = blockquoteContent.match(/^\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i);
        
        if (alertMatch) {
          const type = alertMatch[1].toUpperCase();
          // Find following lines if they are part of the quote block
          let alertContent = blockquoteContent.replace(/^\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]\s*/i, '');
          
          // Style setup based on type
          const alertStyles = {
            NOTE: 'bg-blue-500/5 border-l-4 border-blue-500 text-blue-900 dark:text-blue-200',
            TIP: 'bg-emerald-500/5 border-l-4 border-emerald-500 text-emerald-900 dark:text-emerald-200',
            IMPORTANT: 'bg-violet-500/5 border-l-4 border-violet-500 text-violet-900 dark:text-violet-200',
            WARNING: 'bg-amber-500/5 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200',
            CAUTION: 'bg-rose-500/5 border-l-4 border-rose-500 text-rose-900 dark:text-rose-200',
          };

          elements.push(
            <div key={i} className={`p-4 rounded-r-xl my-4 text-sm font-medium ${alertStyles[type] || alertStyles.NOTE}`}>
              <div className="flex items-center gap-1.5 font-bold mb-1 tracking-wider text-xs">
                <span>{type}</span>
              </div>
              <p dangerouslySetInnerHTML={{ __html: parseInlineStyles(alertContent) }} />
            </div>
          );
        } else {
          elements.push(
            <blockquote key={i} className="border-l-4 border-[rgb(var(--accent-color))] bg-violet-500/5 px-4 py-3 rounded-r-xl my-4 italic text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: parseInlineStyles(blockquoteContent) }} />
          );
        }
        continue;
      }

      // 6. Dividers
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={i} className="my-6 border-t border-gray-200/10" />);
        continue;
      }

      // 7. Standard Paragraphs
      if (line.trim()) {
        elements.push(
          <p key={i} className="leading-relaxed mb-3.5 text-gray-600 dark:text-gray-300 text-sm md:text-base" dangerouslySetInnerHTML={{ __html: parseInlineStyles(line) }} />
        );
      }
    }

    // Flush any leftover elements
    flushList('final');
    flushTable('final');

    return elements;
  };

  // Inline formatting tags parsing
  const parseInlineStyles = (text) => {
    let html = text;

    // Bold text **word**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic text *word*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Inline code blocks \`code\`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-xxs font-mono text-[rgb(var(--accent-color))] px-1.5 py-0.5 rounded-md">$1</code>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[rgb(var(--accent-color))] hover:underline font-semibold">$1</a>');

    // Simple LaTeX Math Formula helpers ($eq$ or $$eq$$)
    html = html.replace(/\$\$([^$]+)\$\$/g, '<div class="text-center font-mono my-2 text-sm bg-gray-50/20 dark:bg-gray-900/10 p-2 rounded-lg border border-gray-200/10 text-[rgb(var(--accent-color))]">$1</div>');
    html = html.replace(/\$([^$]+)\$/g, '<code class="font-mono text-[rgb(var(--accent-color))] px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">$1</code>');

    return html;
  };

  return (
    <div className="notes-markdown prose dark:prose-invert max-w-none text-left leading-relaxed">
      {parseMarkdownToReact(content)}
    </div>
  );
}
