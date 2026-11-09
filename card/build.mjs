// Builds the credit-card-size quick start card (English + Simplified Chinese) into card/dist/.
// Usage: node card/build.mjs   Needs: qrencode, rsvg-convert, pdftocairo + pdffonts (poppler); no npm packages.
//
// The PDFs have all text converted to outlines (vector paths, no fonts), which is what print designers
// ask for: text is drawn with rsvg, then round-tripped PDF -> SVG (pdftocairo turns glyphs into paths) -> PDF.
//
// All card text lives in COPY below. Every statement comes from the guide (sections 1, 2.1, 2.3, 4),
// so when those change, change this too, in both languages.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const OUT = new URL('./dist/', import.meta.url).pathname;
const GUIDE_URL = 'therealkamisama.github.io/AIOC-Guide';

// ISO/IEC 7810 ID-1, in mm. All drawing coordinates are mm from the trim corner.
const W = 85.6, H = 53.98, CORNER = 3.18, BLEED = 3, M = 4.5;
const pt = (n) => n * 0.3528;

// Colours are the site's light theme and its "LCD" panel (site/template.html :root).
const C = { lcd: '#1c2a35', amber: '#ffb26b', accent: '#c2410c', ink: '#15212c', muted: '#566573', line: '#d5dce3', white: '#ffffff', onLcd: '#e3eaf0', onLcdMuted: '#a9b7c3' };
const MONO = 'Noto Sans Mono';

// A line is a string, or an array of runs: a string, { mono } for commands and device names,
// or { u } for underlined text (used to mark VPTT, which the retailer ships switched on).
const COPY = {
  en: {
    font: 'Noto Sans', lang: 'en',
    subtitle: 'All-In-One-Cable Quick Start',
    steps: ['Radio off. Push both K1 plugs fully in.', 'Connect USB-C to your computer.', 'Radio on, then open your software.'],
    noDrivers: 'No drivers on Windows, Linux or macOS.',
    scan: 'Scan for the full guide',
    scanSub: 'Software setup · PTT fixes',
    ai: 'Send it to an AI agent for help',
    heading: 'One cable: sound card + PTT + serial',
    sound: { label: ['Sound', 'card'], lines: ['Shows as “All-In-One-Cable”: mono, 48 kHz, RX + TX audio.', 'Select it in your app only, or system sounds will transmit.'] },
    ptt: {
      label: ['PTT'],
      rows: [
        [[{ u: 'VPTT' }], [[{ u: 'PTT1, as shipped' }, ': TX audio keys the radio.'], 'No PTT setup needed in your software.']],
        ['PTT2', ['CM108 GPIO4, for dual-PTT radios only.']],
        ['Others', ['CM108 GPIO3 and serial DTR/RTS are off.', 'Add them in AIOC Toolkit → PTT Sources.']],
      ],
    },
    serial: {
      label: ['Serial'],
      lines: ['Radio programming (CHIRP).', ['Windows ', { mono: 'COMx' }, ' · Linux ', { mono: '/dev/ttyACMx' }], ['macOS ', { mono: '/dev/cu.usbmodem*' }]],
    },
    legal: 'Transmitting needs a licence. Test into a dummy load or on low power.',
  },
  zh: {
    font: 'Noto Sans CJK SC', lang: 'zh-CN',
    subtitle: 'All-In-One-Cable 快速入门',
    steps: ['关闭电台，把 K1 双插头完全插到底。', '用 USB-C 线连接电脑。', '打开电台，再打开要用的软件。'],
    noDrivers: 'Windows、Linux、macOS 均免驱。',
    scan: '扫码查看完整指南',
    scanSub: '软件配置 · PTT 排障',
    ai: '可发给 AI 助手，帮你了解 AIOC',
    heading: '一根线顶三样：声卡 + PTT + 串口',
    sound: { label: ['声卡'], lines: ['显示为“All-In-One-Cable”：单声道，48 kHz，收发音频。', '只在电台软件里选择它，否则系统提示音也会被发射。'] },
    ptt: {
      label: ['PTT'],
      rows: [
        [[{ u: 'VPTT' }], [[{ u: 'PTT1 出厂设置' }, '：有发射音频就自动发射。'], '软件里无需设置 PTT。']],
        ['PTT2', ['CM108 GPIO4，仅用于双 PTT 电台。']],
        ['其他', ['CM108 GPIO3 和串口 DTR/RTS 已关闭，', '需要时在 AIOC Toolkit → PTT Sources 中添加。']],
      ],
    },
    serial: {
      label: ['串口'],
      lines: ['用于电台写频（CHIRP）。', ['Windows ', { mono: 'COMx' }, ' · Linux ', { mono: '/dev/ttyACMx' }], ['macOS ', { mono: '/dev/cu.usbmodem*' }]],
    },
    legal: '发射需持有业余无线电执照。测试时请接假负载或使用小功率。',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function text(x, y, line, { size, fill = C.ink, weight = 400, anchor = 'start', font }) {
  const runs = (Array.isArray(line) ? line : [line]).map((r) =>
    typeof r === 'string' ? `<tspan>${esc(r)}</tspan>`
      : r.u !== undefined ? `<tspan text-decoration="underline">${esc(r.u)}</tspan>`
      : `<tspan font-family="${MONO}" font-size="${pt(size - 0.3).toFixed(3)}">${esc(r.mono)}</tspan>`);
  return `<text xml:space="preserve" x="${x}" y="${y}" font-family="${font}" font-size="${pt(size).toFixed(3)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${runs.join('')}</text>`;
}

// QR with the 4-module quiet zone the spec asks for, drawn on a white tile as one vector path.
function qr(url, x, y, size) {
  const rows = execFileSync('qrencode', ['-l', 'Q', '-m', '0', '-t', 'ASCII', '-o', '-', url], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const n = rows[0].length / 2, u = size / (n + 8);
  let d = '';
  rows.forEach((row, ry) => {
    for (let cx = 0; cx < n; cx++) {
      if (row[cx * 2] !== '#') continue;
      let run = 1;
      while (cx + run < n && row[(cx + run) * 2] === '#') run++;
      d += `M${(x + (cx + 4) * u).toFixed(3)} ${(y + (ry + 4) * u).toFixed(3)}h${(run * u).toFixed(3)}v${u.toFixed(3)}h${(-run * u).toFixed(3)}z`;
      cx += run - 1;
    }
  });
  return { n, moduleMm: u, svg: `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1.2" fill="#fff"/><path d="${d}" fill="#000" shape-rendering="crispEdges"/>` };
}

function front(code) {
  const c = COPY[code], font = c.font;
  const tile = 29, tx = W - M - tile;
  const q = qr(`https://${GUIDE_URL}/#${code}`, tx, M, tile);
  const stepY = [23.6, 28, 32.4];
  const body = [
    `<rect class="bg" fill="${C.lcd}"/>`,
    text(M, 14, 'AIOC', { size: 30, weight: 700, fill: C.amber, font: 'Noto Sans' }),
    text(M, 18.6, c.subtitle, { size: 7.5, fill: C.white, font }),
    ...c.steps.flatMap((s, i) => [
      `<circle cx="${M + 1.25}" cy="${stepY[i] - 0.85}" r="1.25" fill="${C.amber}"/>`,
      text(M + 1.25, stepY[i] - 0.25, String(i + 1), { size: 5.5, weight: 700, fill: C.lcd, anchor: 'middle', font: 'Noto Sans' }),
      text(M + 3.6, stepY[i], s, { size: 6.4, fill: C.onLcd, font }),
    ]),
    text(M, 37.6, c.noDrivers, { size: 6.4, fill: C.onLcdMuted, font }),
    q.svg,
    text(tx + tile / 2, 37.4, c.scan, { size: 7, weight: 700, fill: C.amber, anchor: 'middle', font }),
    text(tx + tile / 2, 40.4, c.scanSub, { size: 5.8, fill: C.onLcdMuted, anchor: 'middle', font }),
    // The guide is written for AI agents (and the page copies it for them), so point customers at that.
    text(tx + tile / 2, 43.4, c.ai, { size: 5.8, fill: C.onLcd, anchor: 'middle', font }),
    `<line x1="${M}" y1="45.4" x2="${W - M}" y2="45.4" stroke="#3a4a57" stroke-width="0.2"/>`,
    text(M, 49.2, [{ mono: GUIDE_URL }], { size: 7.2, fill: C.onLcd, font }),
  ];
  return { body: body.join(''), lang: c.lang, q };
}

function back(code) {
  const c = COPY[code], font = c.font;
  const labelX = M, textX = M + 13, subX = textX + 10.5, lh = 3.2, size = 6.4;
  const out = [`<rect class="bg" fill="#fff"/>`];
  out.push(text(M, 8, c.heading, { size: 9, weight: 700, fill: C.accent, font }));

  let y = 13.2;
  const block = (label, draw) => {
    const top = y - 2.3;
    label.forEach((l, i) => out.push(text(labelX, y + i * lh, l, { size: 6.8, weight: 700, font })));
    draw();
    return top;
  };
  const rule = () => { out.push(`<line x1="${M}" y1="${y - 3.1}" x2="${W - M}" y2="${y - 3.1}" stroke="${C.line}" stroke-width="0.2"/>`); };

  block(c.sound.label, () => { c.sound.lines.forEach((l) => { out.push(text(textX, y, l, { size, font })); y += lh; }); });
  y += 1.4; rule();
  block(c.ptt.label, () => {
    c.ptt.rows.forEach(([name, lines]) => {
      out.push(text(textX, y, name, { size, weight: 700, fill: C.accent, font }));
      lines.forEach((l) => { out.push(text(subX, y, l, { size, font })); y += lh; });
    });
  });
  y += 1.4; rule();
  block(c.serial.label, () => { c.serial.lines.forEach((l) => { out.push(text(textX, y, l, { size, font })); y += lh; }); });

  out.push(text(M, H - M + 0.4, c.legal, { size: 5.6, fill: C.muted, font }));
  return { body: out.join(''), lang: c.lang };
}

// bleed: for a print shop, artwork extends BLEED mm past the cut. trim: exact card size.
// The background is drawn exactly to the canvas edge: a rect past the page gets clipped short in the outline step.
function svg({ body, lang }, mode) {
  const b = mode === 'bleed' ? BLEED : 0;
  const bg = `<rect x="${-b}" y="${-b}" width="${W + 2 * b}" height="${H + 2 * b}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xml:lang="${lang}" width="${(W + 2 * b).toFixed(2)}mm" height="${(H + 2 * b).toFixed(2)}mm" viewBox="${-b} ${-b} ${W + 2 * b} ${H + 2 * b}">${body.replace('<rect class="bg"', bg)}</svg>`;
}

// Text PDF -> one outlined SVG per page -> outlined PDF. Returns the page SVGs.
function outline(textPdf, outPdf, stem) {
  const pages = [1, 2].map((n) => {
    const p = `${stem}-p${n}.svg`;
    execFileSync('pdftocairo', ['-svg', '-origpagesizes', '-noshrink', '-nocenter', '-f', String(n), '-l', String(n), textPdf, p]);
    return p;
  });
  execFileSync('rsvg-convert', ['-f', 'pdf', '-o', outPdf, ...pages]);
  const fonts = execFileSync('pdffonts', [outPdf], { encoding: 'utf8' }).trim().split('\n').slice(2);
  if (fonts.length) throw new Error(`${outPdf} still contains fonts:\n${fonts.join('\n')}`);
  return pages;
}

// Preview PNG of the cut card (rounded ID-1 corners), drawn from the outlined page so it matches the print exactly.
function preview(pageSvg, outPng) {
  const p = pageSvg.replace(/\.svg$/, '-preview.svg');
  writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><clipPath id="c"><rect width="${W}" height="${H}" rx="${CORNER}"/></clipPath><g clip-path="url(#c)"><image xlink:href="${basename(pageSvg)}" width="${W}" height="${H}"/></g></svg>`);
  execFileSync('rsvg-convert', ['-d', '600', '-p', '600', '-o', outPng, p]);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'aioc-card-'));
for (const code of Object.keys(COPY)) {
  const f = front(code), b = back(code);
  const pages = (mode) => [['front', f], ['back', b]].map(([side, page]) => {
    const p = join(tmp, `${code}-${side}-${mode}.svg`);
    writeFileSync(p, svg(page, mode));
    return p;
  });
  const build = (mode, name) => {
    const textPdf = join(tmp, `${code}-${mode}-text.pdf`);
    execFileSync('rsvg-convert', ['-f', 'pdf', '-o', textPdf, ...pages(mode)]);
    return outline(textPdf, `${OUT}aioc-card-${code}-${name}.pdf`, join(tmp, `${code}-${mode}-outlined`));
  };
  build('bleed', 'print-3mm-bleed');
  const [pf, pb] = build('trim', 'exact-size');
  preview(pf, `${OUT}aioc-card-${code}-front.png`);
  preview(pb, `${OUT}aioc-card-${code}-back.png`);
  console.log(`${code}: QR ${f.q.n}x${f.q.n} modules, ${f.q.moduleMm.toFixed(2)} mm per module`);
}
rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${OUT}`);
