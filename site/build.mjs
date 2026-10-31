// Builds index.html from ../AIOC-Quick-Start-Guide.md
// Usage: node build.mjs   (set OUT_DIR=dir to also write a deployable copy)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const md = readFileSync(new URL('../AIOC-Quick-Start-Guide.md', import.meta.url), 'utf8');

// Drop the H1 and the "Purpose" blockquote; the page header replaces them.
// The retailer appendix stays in the Markdown only.
const body = md.replace(/^# .*\n/, '').replace(/^\s*>[\s\S]*?\n---\n/, '')
  .replace(/\n---\n\n## Appendix A[\s\S]*$/, '\n');

let html = marked.parse(body, { gfm: true });

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// Heading ids: "5.3 Direwolf" -> s5-3, "Appendix A" -> appendix-a
const toc = [];
html = html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (m, lvl, inner) => {
  const text = decode(inner).trim();
  const num = text.match(/^(\d+(?:\.\d+)*)\.?\s/);
  let id = num ? 's' + num[1].replace(/\./g, '-')
    : text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  if (toc.some((t) => t.id === id)) id += '-' + toc.length;
  if (lvl !== '4') toc.push({ id, lvl: +lvl, text: text.replace(/\s*\[[^\]]+\]\s*$/, '') });
  return `<h${lvl} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${inner}</h${lvl}>`;
});

// Confidence tags -> pills
html = html.replace(/<strong>\[([^\]]+)\]<\/strong>/g, (m, label) => {
  const k = label.toLowerCase();
  const cls = k.startsWith('official') ? 'official' : k.startsWith('tool') ? 'tool' : k.startsWith('community') ? 'community' : 'typical';
  return `<span class="tag tag-${cls}">${label}</span>`;
});

// Wrap tables for horizontal scroll; code blocks get a frame for the copy button
html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
html = html.replace(/<pre>/g, '<div class="code"><pre>').replace(/<\/pre>/g, '</pre></div>');

// Wrap each H2 block in a <section> so search can filter
html = html.replace(/<hr>\s*/g, '');
const parts = html.split(/(?=<h2 id=)/);
html = parts.map((p) => (p.startsWith('<h2') ? `<section class="doc-section">${p}</section>` : p)).join('\n');

const tocHtml = toc.map((t) => `<li class="l${t.lvl}"><a href="#${t.id}">${t.text}</a></li>`).join('\n');
const mdPublic = md.replace(/\n---\n\n## Appendix A[\s\S]*$/, '\n');
const mdEscaped = mdPublic.replace(/<\/script/gi, '<\\/script');

const page = readFileSync(new URL('./template.html', import.meta.url), 'utf8')
  .replace('<!--TOC-->', () => tocHtml)
  .replace('<!--GUIDE-->', () => html)
  .replace('<!--MD-->', () => mdEscaped);

writeFileSync(new URL('./index.html', import.meta.url), page);
console.log(`index.html written: ${toc.length} headings, ${(page.length / 1024).toFixed(0)} KiB`);

// OUT_DIR (used by the Pages workflow): also publish the page plus the public Markdown for agents.
if (process.env.OUT_DIR) {
  mkdirSync(process.env.OUT_DIR, { recursive: true });
  writeFileSync(join(process.env.OUT_DIR, 'index.html'), page);
  writeFileSync(join(process.env.OUT_DIR, 'AIOC-Quick-Start-Guide.md'), mdPublic);
  console.log(`Copied page and Markdown to ${process.env.OUT_DIR}`);
}
