import { escapeHtml } from './artwork.mjs';

export const revision = '20260903-fast-v2';
export const fps = 30;
export const sourceArea = { x: 150, y: 660, width: 780, height: 728 };
export const palettes = {
  pink: { background: '#ffe1eb', ink: '#6d6435', accent: '#6c3fc9', wash: '#fff7f1' },
  cream: { background: '#fff7f1', ink: '#6d6435', accent: '#6c3fc9', wash: '#ffe1eb' },
  violet: { background: '#6c3fc9', ink: '#fff7f1', accent: '#ffe1eb', wash: '#8e62de' },
  olive: { background: '#6d6435', ink: '#fff7f1', accent: '#ffe1eb', wash: '#948852' },
};

const clip = (demo, from, to, seconds, focus = 0.45, zoom = 1.08) => ({ demo, from, to, seconds, focus, zoom });
const felt = seconds => ({ image: 'public/assets/observer-guide-still-life.png', seconds, focus: 0.5, zoom: 1.06 });

// Source-time cuts retain real actions and their outcomes; dead time is omitted.
export const edits = {
  '01-geneza': [felt(1.2), clip('atlas', 1.4, 3.7, 1.5), clip('reader', 8.5, 10, 1.5), clip('height', 11.1, 13.1, 1.5), clip('wind', 16.1, 17.8, 1.5)],
  '02-atlas': [clip('atlas', 1.35, 3.55, 1.6), clip('atlas', 3.6, 5.15, 1.6, 0.2), clip('atlas', 6.15, 7.45, 1.6), clip('atlas', 9.35, 10.6, 1.6, 0.65), clip('atlas', 19.75, 21.25, 1.6, 0.65)],
  '03-lekcja': [clip('lesson', 0.65, 2.25, 1.6), clip('lesson', 3.4, 6.6, 1.6), clip('lesson', 7.5, 9.1, 1.6), clip('lesson', 14.8, 16.35, 1.6, 0.8), clip('lesson', 17.45, 19, 1.6, 0.6)],
  '04-metar': [clip('reader', 5.7, 7.25, 1.5, 0.6), clip('reader', 8.35, 9.95, 1.5, 0.25), clip('reader', 17.25, 18.9, 1.5, 0.2), clip('reader', 19.4, 21, 1.5, 0.55)],
  '05-czytnik': [clip('reader', 1.35, 3.1, 1.4, 0.2), clip('reader', 5.65, 7.2, 1.4, 0.6), clip('reader', 8.4, 9.95, 1.4, 0.3), clip('reader', 17.45, 19, 1.4, 0.2), clip('reader', 19.45, 21.1, 1.4, 0.55)],
  '06-windy': [clip('layers', 1.7, 3.9, 1.6, 0.25), clip('height', 1.3, 2.8, 1.6, 0.35), clip('height', 11.15, 13.05, 1.6, 0.45), clip('layers', 17.5, 19.2, 1.6, 0.6)],
  '07-warstwy': [clip('layers', 2.55, 3.95, 1.44, 0.25), clip('layers', 4, 5.3, 1.44, 0.25), clip('layers', 6.9, 8.35, 1.44, 0.55), clip('layers', 17.4, 18.75, 1.44, 0.6), clip('layers', 19.5, 21, 1.44, 0.55)],
  '08-wysokosc': [clip('height', 1.2, 2.65, 1.44, 0.3), clip('height', 4.3, 5.75, 1.44, 0.4), clip('height', 11.1, 13.05, 1.44, 0.4), clip('height', 16.15, 17.6, 1.44, 0.4), clip('height', 17.65, 19.1, 1.44, 0.4)],
  '09-zagle': [clip('wind', 1.3, 2.6, 1.6, 0.35), clip('wind', 12.2, 14.15, 1.6, 0.35), clip('wind', 16, 17.8, 1.6, 0.25), clip('wind', 18.15, 19.6, 1.6, 0.6), clip('wind', 21.2, 22.6, 1.6, 0.3)],
  '10-zaproszenie': [clip('atlas', 3.4, 4.7, 1.2, 0.2), clip('lesson', 15, 16.3, 1.2, 0.75), clip('reader', 18, 19.35, 1.2, 0.25), clip('height', 11.5, 13, 1.2, 0.4), clip('wind', 21.35, 22.6, 1.2, 0.3), felt(1.2)],
};

export function durationFor(story) {
  return edits[story.id].reduce((sum, shot) => sum + Math.round(shot.seconds * fps), 0) / fps;
}

export function promoHtml(story, css) {
  const palette = palettes[story.theme];
  const footer = story.note || story.credit || (story.visual === 'observer'
    ? 'Przykłady szkoleniowe. Fot. PiccoloNamek i inni. Licencje:\njakiesluchawki.github.io/chmurnik/premiera/historia/#credits'
    : 'CHMURNIK · z ciekawości nieba');
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(story.lead)}</title><style>${css}</style></head><body><main class="promo ${story.theme}" style="--ink:${palette.ink};--accent:${palette.accent}">
    <header><img src="/public/brand/chmurnik-wordmark.png" alt="CHMURNIK"><span>${escapeHtml(story.label.toLocaleUpperCase('pl-PL'))} / ${String(story.number).padStart(2, '0')}</span></header>
    <section class="copy-panel"><h1 data-copy="lead">${escapeHtml(story.lead)}</h1><p data-copy="body">${story.parts.map((part, index) => `<span data-part="${index}">${escapeHtml(part)}</span>`).join(' ')}</p></section>
    ${story.cta ? `<p class="cta" data-copy="cta">${escapeHtml(story.cta)}</p>` : ''}
    <footer>${escapeHtml(footer)}</footer></main></body></html>`;
}
