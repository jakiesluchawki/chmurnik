import { stories, storeUrl, stickerArea, campaign } from './copy.mjs';
import { metarExamples } from '../../src/data/field-practice.js';
export { storeUrl, stickerArea, campaign };

export const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const logo = '<img class="wordmark" src="/public/brand/chmurnik-wordmark.png" alt="CHMURNIK">';
const image = (source, alt, className = '') => `<img class="${className}" src="${source}" alt="${escapeHtml(alt)}">`;
const poster = story => `/social/2026-09-03-full/captures/${story.demo || 'layers'}-poster.png`;
const sources = story => [
  'owner-approved-ten-story-copy-2026-09-02', 'public/brand/chmurnik-wordmark.png',
  ...(story.visual === 'observer' ? ['public/assets/observer-guide-still-life.png']
    : story.visual === 'metar' ? ['src/data/field-practice.js']
    : [poster(story).slice(1), story.demo === 'reader' || story.demo === 'wind' ? 'src/components/FieldPractice.jsx' : 'src/App.jsx']),
];

function visual(story) {
  if (story.visual === 'observer') return image('/public/assets/observer-guide-still-life.png', 'Dekoracyjny filcowy obiekt CHMURNIKA w kształcie oka', 'observer');
  if (story.visual === 'metar') return `<div class="report-art" data-safe><span>METAR · PRZYKŁAD TRENINGOWY</span><code>${escapeHtml(metarExamples[0].report)}</code><p>wiatr · widzialność · chmury</p></div>`;
  const caption = story.demo === 'atlas'
    ? 'Fot. PiccoloNamek<br><a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a><br><a href="https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg">Cirrus / źródło zdjęcia</a>'
    : `CHMURNIK / ${escapeHtml(story.demoLabel || 'prawdziwy interfejs aplikacji')}`;
  return `<figure class="ui-poster">${image(poster(story), `Prawdziwy interfejs CHMURNIKA: ${story.label}`)}<figcaption>${caption}</figcaption></figure>`;
}

function content(story, format) {
  return `<header data-safe>${logo}<span>${escapeHtml(story.label.toLocaleUpperCase('pl-PL'))} / ${String(story.number).padStart(2, '0')}</span></header>
    <section class="composition"><h1 data-safe>${escapeHtml(story.lead)}</h1><p class="body-copy" data-safe>${escapeHtml(story.body)}</p><div class="art-visual">${visual(story)}</div>${story.cta ? `<p class="cta" data-safe><a href="${storeUrl}">${escapeHtml(story.cta)}</a></p>` : ''}</section>
    <footer data-safe>${escapeHtml(story.note || story.credit || (format === 'story' ? 'CHMURNIK · z ciekawości nieba' : 'CHMURNIK · bezpłatnie na iPhone’a'))}${format === 'carousel' ? `<span>${String(story.number).padStart(2, '0')} / 10</span>` : ''}</footer>`;
}

export const artworks = [
  ...stories.map(story => ({ ...story, id: `story-${story.id}`, storyId: story.id, title: `${String(story.number).padStart(2, '0')} / ${story.label}`, format: 'story', alt: `${story.lead} ${story.body}${story.note ? ` ${story.note}` : ''}`, sources: sources(story), content: content(story, 'story') })),
  ...stories.map(({ demo, stickerLabel, stickerArea: unused, ...story }) => ({ ...story, id: `karuzela-${story.id}`, storyId: story.id, title: `${String(story.number).padStart(2, '0')} / ${story.label}`, format: 'carousel', alt: `${story.lead} ${story.body}${story.note ? ` ${story.note}` : ''}`, sources: sources({ ...story, demo }), content: content({ ...story, demo }, 'carousel') })),
  {
    id: 'facebook-z-kogos-bliskiego', title: 'Facebook / grafika do posta', format: 'facebook', theme: 'cream', visual: 'observer', number: 1,
    alt: 'CHMURNIK. Zrobiłem dla kogoś bliskiego. Teraz dzielę się z Tobą. Atlas chmur, lekcje, METAR i TAF, pracownie Windy i wiatru. Bezpłatnie na iPhone’a. Oryginalny filcowy obiekt w kształcie oka.',
    sources: ['owner-approved-ten-story-copy-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'public/assets/observer-guide-still-life.png'],
    content: `<header data-safe>${logo}<span>Z CIEKAWOŚCI NIEBA</span></header><section class="composition"><h1 data-safe>Zrobiłem dla kogoś bliskiego.<br>Teraz dzielę się z Tobą.</h1><div class="art-visual">${image('/public/assets/observer-guide-still-life.png', 'Dekoracyjny filcowy obiekt CHMURNIKA w kształcie oka', 'observer')}</div><p class="body-copy" data-safe>Atlas chmur i lekcje. METAR i TAF.<br>Pracownie Windy i wiatru.</p><p class="cta" data-safe>Bezpłatnie na iPhone’a.</p></section><footer data-safe>Narzędzia edukacyjne · link do App Store w treści posta</footer>`,
  },
];

export function artworkHtml(artwork, css) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(artwork.title)}</title><style>${css}</style></head><body><main id="artwork" class="artwork ${artwork.format} ${artwork.theme} ${artwork.id}">${artwork.content}${artwork.format === 'story' ? '<div class="sticker-area" aria-hidden="true"></div>' : ''}</main></body></html>`;
}

export function recordingHtml(story, css, appUrl) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(story.lead)}</title><style>${css}</style></head><body><main id="artwork" class="artwork story recording ${story.theme}"><header data-safe>${logo}<span>${escapeHtml(story.label.toLocaleUpperCase('pl-PL'))} / ${String(story.number).padStart(2, '0')}</span></header><h1 data-safe>${escapeHtml(story.lead)}</h1><p class="live-copy" data-safe>${escapeHtml(story.parts[0])}</p><div class="demo-frame"><iframe name="app-demo" title="Działający CHMURNIK" src="${appUrl}"></iframe></div><div class="touch-indicator" aria-hidden="true"></div><div class="sticker-area" aria-hidden="true"></div><footer data-safe>${escapeHtml(story.note || story.credit || story.demoLabel || 'Prawdziwy interfejs CHMURNIKA')}</footer></main></body></html>`;
}
