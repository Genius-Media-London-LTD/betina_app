// Genius2Play bodies are Markdown; the app renders plain-text paragraphs.
// Convert Markdown into clean paragraphs (no syntax, no HTML).

function inline(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(\*|_)(?=\S)(.+?)(?<=\S)\1/g, '$2') // italic
    .replace(/<[^>]+>/g, '') // stray HTML
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function markdownToParagraphs(md, title = '') {
  if (!md) return [];
  const blocks = md.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const out = [];
  for (const raw of blocks) {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Tables: keep data rows as "a · b · c", drop the |---| separator.
    if (lines.every((l) => l.startsWith('|'))) {
      for (const l of lines) {
        if (/^\|[\s:|-]+\|$/.test(l)) continue;
        const cells = l.split('|').map((c) => inline(c)).filter(Boolean);
        if (cells.length) out.push(cells.join(' · '));
      }
      continue;
    }

    // Lists: one paragraph, one bullet per line.
    if (lines.every((l) => /^([-*+]|\d+[.)])\s+/.test(l))) {
      out.push(lines.map((l) => '• ' + inline(l.replace(/^([-*+]|\d+[.)])\s+/, ''))).join('\n'));
      continue;
    }

    const text = inline(lines.map((l) => l.replace(/^#{1,6}\s+/, '').replace(/^>\s?/, '')).join(' '));
    if (!text) continue;
    // The leading "# Title" just repeats the headline.
    if (out.length === 0 && title && text.toLowerCase() === title.trim().toLowerCase()) continue;
    out.push(text);
  }
  return out;
}
