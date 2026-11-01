// Builds index.html (English + Simplified Chinese in one page) from the guide Markdown files.
// Usage: node build.mjs   (set OUT_DIR=dir to also write a deployable copy)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const LANGS = [
  { code: 'en', file: 'AIOC-Quick-Start-Guide.md', idSuffix: '', anchorLabel: 'Link to this section' },
  { code: 'zh', file: 'AIOC-Quick-Start-Guide.zh-CN.md', idSuffix: '-zh', anchorLabel: '本节链接' },
];

// Display names for the source tags in the Chinese page (the Markdown keeps the English tags).
const ZH_TAG_WORDS = [
  ['Official example', '官方示例'], ['Official settings', '官方设置'], ['Typical extras', '常规补充'],
  ['firmware settings.h', '固件 settings.h'], ['used in G1LRO&#39;s guide', 'G1LRO 教程采用'], ['Dec 2025', '2025年12月'],
  ['Official', '官方'], ['Tool docs', '工具文档'], ['Community', '社区'], ['Typical', '常规'],
];

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const stripAppendix = (md) => md.replace(/\n---\n\n## Appendix A[\s\S]*$/, '\n');

function render(lang) {
  const md = readFileSync(new URL(`../${lang.file}`, import.meta.url), 'utf8');

  // Drop the H1 and the "Purpose" blockquote; the page header replaces them.
  // The retailer appendix stays in the Markdown only.
  const body = stripAppendix(md.replace(/^# .*\n/, '').replace(/^\s*>[\s\S]*?\n---\n/, ''));
  let html = marked.parse(body, { gfm: true });

  // Heading ids come from the section number: "5.3 Direwolf" -> s5-3 (Chinese: s5-3-zh)
  // Unnumbered headings get the last section number plus a letter (s1-a, s1-b), so both languages match.
  const toc = [];
  let lastNum = 's0', letter = 0;
  html = html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (m, lvl, inner) => {
    const text = decode(inner).trim();
    const num = text.match(/^(\d+(?:\.\d+)*)\.?\s/);
    if (num) { lastNum = 's' + num[1].replace(/\./g, '-'); letter = 0; }
    let id = (num ? lastNum : lastNum + '-' + String.fromCharCode(97 + letter++)) + lang.idSuffix;
    if (toc.some((t) => t.id === id)) id += '-' + toc.length;
    if (lvl !== '4') toc.push({ id, lvl: +lvl, text: text.replace(/\s*\[[^\]]+\]\s*$/, '') });
    return `<h${lvl} id="${id}"><a class="anchor" href="#${id}" aria-label="${lang.anchorLabel}">#</a>${inner}</h${lvl}>`;
  });

  // Source tags -> pills (class from the English first word, label localized)
  html = html.replace(/<strong>\[([^\]]+)\]<\/strong>/g, (m, label) => {
    const k = label.toLowerCase();
    const cls = k.startsWith('official') ? 'official' : k.startsWith('tool') ? 'tool' : k.startsWith('community') ? 'community' : 'typical';
    let shown = label;
    if (lang.code === 'zh') for (const [en, zh] of ZH_TAG_WORDS) shown = shown.split(en).join(zh);
    return `<span class="tag tag-${cls}">${shown}</span>`;
  });

  // Wrap tables for horizontal scroll; code blocks get a frame for the copy button
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<pre>/g, '<div class="code"><pre>').replace(/<\/pre>/g, '</pre></div>');

  // Wrap each H2 block in a <section> so search can filter
  html = html.replace(/<hr>\s*/g, '');
  html = html.split(/(?=<h2 id=)/).map((p) => (p.startsWith('<h2') ? `<section class="doc-section">${p}</section>` : p)).join('\n');

  // Bold that CommonMark refused to open (e.g. "**" next to CJK + punctuation) shows up as literal asterisks
  const stray = decode(html.replace(/<(pre|code)[\s\S]*?<\/\1>/g, '')).match(/\*\*/g);
  if (stray) console.warn(`[${lang.code}] ${stray.length} unrendered "**" — add spaces around those bold markers`);

  const tocHtml = toc.map((t) => `<li class="l${t.lvl}"><a href="#${t.id}">${t.text}</a></li>`).join('\n');
  return { html, tocHtml, toc, mdPublic: stripAppendix(md) };
}

const out = Object.fromEntries(LANGS.map((l) => [l.code, render(l)]));
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');

const page = readFileSync(new URL('./template.html', import.meta.url), 'utf8')
  .replace('<!--TOC_EN-->', () => out.en.tocHtml)
  .replace('<!--TOC_ZH-->', () => out.zh.tocHtml)
  .replace('<!--GUIDE_EN-->', () => out.en.html)
  .replace('<!--GUIDE_ZH-->', () => out.zh.html)
  .replace('<!--MD_EN-->', () => esc(out.en.mdPublic))
  .replace('<!--MD_ZH-->', () => esc(out.zh.mdPublic));

// The two translations must keep the same section numbers so links and the finder work in both.
const ids = (l) => out[l].toc.map((t) => t.id.replace(/-zh$/, '')).join();
if (ids('en') !== ids('zh')) console.warn('Section numbering differs between the English and Chinese guides');

writeFileSync(new URL('./index.html', import.meta.url), page);
console.log(`index.html written: ${out.en.toc.length} + ${out.zh.toc.length} headings, ${(page.length / 1024).toFixed(0)} KiB`);

// OUT_DIR (used by the Pages workflow): also publish the page plus the public Markdown for agents.
if (process.env.OUT_DIR) {
  mkdirSync(process.env.OUT_DIR, { recursive: true });
  writeFileSync(join(process.env.OUT_DIR, 'index.html'), page);
  for (const l of LANGS) writeFileSync(join(process.env.OUT_DIR, l.file), out[l.code].mdPublic);
  console.log(`Copied page and Markdown to ${process.env.OUT_DIR}`);
}
