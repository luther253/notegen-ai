import { jsPDF } from 'jspdf';

export const downloadAsPDF = (note) => {
  // Initialize jsPDF in points (pt) for precise standard A4 page mapping
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  let y = margin;

  // Helper to check page boundaries and add page if needed
  const checkPageEnd = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Add Note Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(124, 58, 237); // Violet color
  
  const titleLines = doc.splitTextToSize(note.title, contentWidth);
  checkPageEnd(titleLines.length * 25);
  titleLines.forEach(line => {
    doc.text(line, margin, y);
    y += 25;
  });

  y += 5;

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray color
  const metaText = `Subject: ${note.subject}   |   Topic: ${note.topic}   |   Difficulty: ${note.difficulty}   |   Date: ${new Date(note.createdAt).toLocaleDateString()}`;
  doc.text(metaText, margin, y);
  y += 15;

  // Line separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  // Split note content into paragraphs/lines
  const lines = note.content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      y += 10;
      continue;
    }

    // Headers (# Topic)
    if (line.startsWith('# ')) {
      const headingText = line.replace('# ', '').trim();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(124, 58, 237); // Purple
      y += 12;
      
      const headingLines = doc.splitTextToSize(headingText, contentWidth);
      checkPageEnd(headingLines.length * 20);
      headingLines.forEach(l => {
        doc.text(l, margin, y);
        y += 20;
      });
      y += 8;
    } else if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '').trim();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(31, 41, 55); // Dark Gray
      y += 10;
      
      const headingLines = doc.splitTextToSize(headingText, contentWidth);
      checkPageEnd(headingLines.length * 18);
      headingLines.forEach(l => {
        doc.text(l, margin, y);
        y += 18;
      });
      y += 6;
    } else if (line.startsWith('### ')) {
      const headingText = line.replace('### ', '').trim();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      y += 8;
      
      const headingLines = doc.splitTextToSize(headingText, contentWidth);
      checkPageEnd(headingLines.length * 16);
      headingLines.forEach(l => {
        doc.text(l, margin, y);
        y += 16;
      });
      y += 6;
    } else if (line.startsWith('> ')) {
      // Blockquotes/Highlights
      const quoteText = line.replace('> ', '').trim();
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(109, 40, 217);
      
      const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 20);
      checkPageEnd(quoteLines.length * 14 + 10);
      
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(2.5);
      doc.line(margin + 5, y - 6, margin + 5, y + (quoteLines.length * 14) - 6);
      
      quoteLines.forEach(l => {
        doc.text(l, margin + 15, y);
        y += 14;
      });
      y += 8;
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\.\s/)) {
      // Bulleted or numbered lists
      let isNumbered = line.match(/^\d+\.\s/);
      let listMarker = isNumbered ? line.match(/^(\d+\.\s)/)[1] : '• ';
      let itemText = isNumbered ? line.replace(/^\d+\.\s/, '').trim() : line.substring(2).trim();
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      
      // Clean markdown bold syntax inside lists
      let plainItemText = itemText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      
      checkPageEnd(14);
      doc.setFont('helvetica', 'bold');
      doc.text(listMarker, margin + 10, y);
      
      doc.setFont('helvetica', 'normal');
      const listLines = doc.splitTextToSize(plainItemText, contentWidth - 22);
      listLines.forEach((l, index) => {
        if (index > 0) {
          checkPageEnd(14);
        }
        doc.text(l, margin + 22, y);
        y += 14;
      });
    } else {
      // Plain paragraphs
      let plainText = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      
      const paragraphLines = doc.splitTextToSize(plainText, contentWidth);
      paragraphLines.forEach(l => {
        checkPageEnd(14);
        doc.text(l, margin, y);
        y += 14;
      });
    }
  }

  doc.save(`${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

export const downloadAsTXT = (note) => {
  const element = document.createElement('a');
  // Format metadata header in the text file
  const metaHeader = `=========================================
SUBJECT: ${note.subject}
TOPIC: ${note.topic}
DIFFICULTY: ${note.difficulty}
DATE CREATED: ${new Date(note.createdAt).toLocaleDateString()}
=========================================\n\n`;
  const file = new Blob([metaHeader + note.content], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const downloadAsMarkdown = (note) => {
  const element = document.createElement('a');
  const file = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const printNoteToPDF = (note) => {
  // We can open a small temporary window containing the formatted HTML notes 
  // and trigger the print window, closing it immediately after.
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print/export notes as PDF.');
    return;
  }

  const htmlContent = `
    <html>
      <head>
        <title>${note.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            padding: 2.5rem;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 2.25rem;
            color: #7c3aed;
            margin-bottom: 0.5rem;
            border-bottom: 2px solid #ddd6fe;
            padding-bottom: 0.5rem;
          }
          .meta {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 2rem;
            display: flex;
            gap: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 1rem;
          }
          h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            color: #1f2937;
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.25rem;
          }
          h3 {
            font-size: 1.25rem;
            color: #374151;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          p, li {
            font-size: 1rem;
            margin-bottom: 0.75rem;
          }
          ul, ol {
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          code {
            font-family: monospace;
            background: #f3f4f6;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-size: 0.9em;
          }
          pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
          }
          pre code {
            background: transparent;
            color: inherit;
            padding: 0;
          }
          blockquote {
            border-left: 4px solid #8b5cf6;
            background: #f9f5ff;
            padding: 0.75rem 1.25rem;
            margin: 1.5rem 0;
            font-style: italic;
            border-radius: 0 0.375rem 0.375rem 0;
          }
          @media print {
            body {
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>${note.title}</h1>
        <div class="meta">
          <span><strong>Subject:</strong> ${note.subject}</span>
          <span><strong>Topic:</strong> ${note.topic}</span>
          <span><strong>Difficulty:</strong> ${note.difficulty}</span>
          <span><strong>Date:</strong> ${new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          ${parseMarkdownToBasicHTML(note.content)}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Simplified client-side Markdown to HTML converter for printing
function parseMarkdownToBasicHTML(markdown) {
  let html = markdown;

  // Escaping basic HTML to prevent injection
  // Replace headers
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  
  // Replace bold & italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Replace code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Replace blockquotes
  html = html.replace(/^\>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Replace links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Process list items (rough conversion)
  html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Wrap loose list items (quick patch)
  // Replacing consecutive <li> tags
  html = html.split('\n').map(line => {
    if (!line.trim().startsWith('<h') && !line.trim().startsWith('<li') && !line.trim().startsWith('<pre') && !line.trim().startsWith('<code') && !line.trim().startsWith('<block') && !line.trim().startsWith('<a') && line.trim()) {
      return `<p>${line}</p>`;
    }
    return line;
  }).join('\n');

  return html;
}
