import React from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '' }) => {
  const parseInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-hf-text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="font-mono text-hf-accent bg-hf-bg-secondary px-1 rounded text-[13px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const parseBlocks = (src: string) => {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    const blocks: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line === undefined) break;
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        i++;
        continue;
      }

      // Headings
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        if (level <= 2) {
          blocks.push(
            <h2 key={i} className="w-full text-[15px] font-bold text-hf-text-primary border-b border-hf-border/10 pb-1 mt-5 mb-2 leading-snug">
              {text}
            </h2>
          );
        } else {
          blocks.push(
            <h4 key={i} className="text-[13px] font-bold text-hf-text-primary mt-3 mb-1.5 leading-snug">
              {text}
            </h4>
          );
        }
        i++;
        continue;
      }

      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const items: string[] = [];
        while (i < lines.length) {
          const l = lines[i];
          if (l === undefined) break;
          const t = l.trim();
          if (t.startsWith('- ') || t.startsWith('* ') || t.startsWith('• ')) {
            items.push(t.substring(2).trim());
            i++;
          } else {
            break;
          }
        }
        blocks.push(
          <ul key={i} className="flex flex-col gap-1.5 mb-2 pl-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start text-[14px] leading-relaxed text-hf-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-hf-accent shrink-0 mt-2 mr-2" />
                <span className="flex-1">{parseInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list
      const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
      if (numMatch) {
        const items: string[] = [];
        while (i < lines.length) {
          const l = lines[i];
          if (l === undefined) break;
          const t = l.trim();
          const m = t.match(/^\d+\.\s+(.*)$/);
          if (m && m[1]) {
            items.push(m[1].trim());
            i++;
          } else {
            break;
          }
        }
        blocks.push(
          <ol key={i} className="flex flex-col gap-1.5 mb-2 pl-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start text-[14px] leading-relaxed text-hf-text-secondary">
                <span className="w-5 h-5 rounded-full bg-hf-accent/12 text-hf-accent font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                  {idx + 1}
                </span>
                <span className="flex-1">{parseInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Paragraph
      const pLines: string[] = [trimmed];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (l === undefined) break;
        const next = l.trim();
        if (next.length === 0) break;
        if (
          /^(#{1,6})\s+/.test(next) ||
          next.startsWith('- ') ||
          next.startsWith('* ') ||
          next.startsWith('• ') ||
          /^\d+\.\s+/.test(next)
        ) {
          break;
        }
        pLines.push(next);
        i++;
      }
      blocks.push(
        <p key={i} className="text-[14px] leading-relaxed text-hf-text-secondary mb-2">
          {parseInline(pLines.join(' '))}
        </p>
      );
    }

    return blocks;
  };

  return <div className={`w-full flex flex-col ${className}`}>{parseBlocks(content)}</div>;
};
