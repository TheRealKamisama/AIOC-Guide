# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A knowledge base for the **AIOC (ham radio All-In-One-Cable)**, maintained by an AIOC retailer. It has two outputs, both from one Markdown source:

1. `AIOC-Quick-Start-Guide.md`: the guide itself. It is written so that **AI agents** can answer customer questions ("I have radio X and OS Y and want to do Z: which software and settings?"). It is also pasted into chat assistants as-is.
2. `site/index.html`: a single-file web page built from the Markdown. It has a "Find your setup" selector, search, copy buttons, and a button that copies the whole Markdown for AI assistants. It is live on GitHub Pages (see Deploy). A private copy is published as a claude.ai artifact (slug `9723f2b5-e6cd-4cc2-bf58-b291fc9e5947`); republish it with `publish_files` after rebuilding.

## Build

```bash
cd site && npm install && npm run build    # = node build.mjs -> writes site/index.html
```
There are no tests or linter. To check the page, open `site/index.html` in a browser (headless check: `firefox --headless --screenshot out.png --window-size=1400,1800 file://$PWD/site/index.html`).

`site/index.html` is generated, but it is committed so it can be served directly. **Never hand-edit it.** Edit the Markdown or `site/template.html`, then rebuild.

## Deploy

- GitHub repo: `TheRealKamisama/AIOC-Guide` (public). Commits use the noreply identity set in the repo's git config (`35005476+TheRealKamisama@users.noreply.github.com`); don't commit with any other email.
- `.github/workflows/pages.yml` runs on every push to `main` (or manually): `npm ci && npm run build` with `OUT_DIR=_site`, then deploys `_site/` to GitHub Pages. The site serves `index.html` plus `AIOC-Quick-Start-Guide.md` (the public Markdown, without Appendix A) for agents to fetch.
- Pages is enabled (source: **GitHub Actions**) at https://therealkamisama.github.io/AIOC-Guide/. Pages on a private repo needs a paid plan, so making the repo private again stops deploys.

## How the build works (`site/build.mjs`)

- It reads `../AIOC-Quick-Start-Guide.md` and removes the H1, the opening "Purpose" blockquote, and everything from `## Appendix A` (the retailer's unfilled placeholders) onward. The appendix is also removed from the embedded Markdown used by the copy button.
- It renders the Markdown with `marked` (pinned to 12.0.2) at build time. The page doesn't need a CDN to show content.
- **Heading ids come from the section number**: `5.3 Direwolf…` → `#s5-3`, `6. PTT…` → `#s6`. Several things depend on these ids: the table of contents, the hero buttons (`#s6`, `#s8`, `#s9`), and the `sec` links in the `GOALS` array in `template.html`. **If you renumber sections, update `GOALS` and the hero links.** The finder hides links whose id doesn't exist, so a broken link fails silently.
- Inline source tags written as `**[Official]**`, `**[Tool docs]**`, `**[Community…]**` and `**[Typical]**` are turned into coloured pills, matched on the first word. Keep that exact bold-bracket form in the Markdown.
- Each `##` block is wrapped in `<section class="doc-section">`. In-page search filters at that level. Tables get a scroll wrapper and code blocks get copy buttons.
- Template slots are `<!--TOC-->`, `<!--GUIDE-->` and `<!--MD-->`. They are filled with function replacements, because the Markdown contains `$` sequences.

## Page constraints (`site/template.html`)

All CSS and JS are inline. The only outside requests are Google Fonts (IBM Plex). There are no other network calls, because the claude.ai artifact sandbox blocks them; keep it that way so one file works both there and on GitHub Pages. The colours are tokens in `:root`, with dark-theme copies under `prefers-color-scheme` and `[data-theme="dark"]`, so change all three together. The finder's data (`GOALS` × `OS`) is hand-written in the inline script. Keep it consistent with the guide's Decision Table (Section 3).

## Editing the guide: content rules

- **Every factual claim carries a source tag.** Official = skuep/AIOC README, release notes or firmware source. Tool docs = aioc-util or third-party software docs. Community = GitHub issues, AllStarLink forum, DigiPi group, or the G1LRO/M0AWS/DL-Nordwest guides. Typical = general practice that hasn't been checked. Don't invent menu paths; mark unverified UI steps as Typical.
- Facts that are easy to get wrong:
  - USB ID `1209:7388`.
  - Default PTT1 = CM108 GPIO3 OR serial `DTR=1 AND RTS=0`.
  - VCOS is reported on the CM108 Volume-Down button.
  - VPTT/VCOS timing registers are **milliseconds × 16**.
  - Hardware rev 1.2 needs firmware ≥ 1.4.0.
  - Some rev 1.0 boards misbehave on 1.4.x, so recommend 1.3.0 for them.
- Keep the document version line at the top, and the firmware release table in Section 9.1, up to date when the information changes.
- Planned next: a customer business-card leaflet with QR codes pointing to the published guide URL.
