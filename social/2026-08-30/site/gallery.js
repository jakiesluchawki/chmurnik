const notice = document.querySelector('#notice');
let noticeTimer;
function announce(message) {
  notice.textContent = message;
  notice.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.remove('visible'), 6500);
}

function element(tag, attributes = {}, text) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

async function copy(text, fallback) {
  try {
    await navigator.clipboard.writeText(text);
    announce('Skopiowane. Możesz wkleić na Instagramie lub w innym miejscu.');
  } catch {
    if (fallback instanceof HTMLTextAreaElement || fallback instanceof HTMLInputElement) {
      fallback.focus();
      fallback.select();
      fallback.setSelectionRange(0, fallback.value.length);
    } else if (fallback) {
      const range = document.createRange();
      range.selectNodeContents(fallback);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    announce('Zaznaczyłem tekst. Wybierz systemowe „Kopiuj”.');
  }
}

function card(artwork) {
  const article = element('article', { class: 'asset' });
  const figure = element('figure');
  const imageLink = element('a', { href: `./${artwork.file}`, target: '_blank', rel: 'noopener', 'aria-label': `Otwórz JPG: ${artwork.title}` });
  imageLink.append(element('img', { src: `./${artwork.thumbnail}`, alt: artwork.alt, width: artwork.width, height: artwork.height, loading: 'lazy', decoding: 'async' }));
  figure.append(imageLink);
  const actions = element('div', { class: 'actions' });
  const open = element('a', { href: `./${artwork.file}`, target: '_blank', rel: 'noopener' }, 'Otwórz JPG');
  const download = element('a', { href: `./${artwork.file}`, download: `${artwork.id}.jpg` }, 'Pobierz plik');
  if (navigator.share && navigator.canShare) {
    const button = element('button', { type: 'button', class: 'secondary', disabled: '' }, 'Przygotowuję zapis…');
    const prepare = async () => {
      try {
        const response = await fetch(`./${artwork.file}`);
        if (!response.ok) throw new Error('Download failed');
        const file = new File([await response.blob()], `${artwork.id}.jpg`, { type: 'image/jpeg' });
        if (!navigator.canShare({ files: [file] })) { button.remove(); return; }
        button.disabled = false;
        button.textContent = 'Zapisz / udostępnij';
        // Prepare the file before the tap so iOS retains user activation for share().
        button.addEventListener('click', () => {
          navigator.share({ files: [file] }).catch(error => {
            if (error.name !== 'AbortError') announce('Wybierz „Otwórz JPG”, a potem przytrzymaj obraz, aby go zapisać.');
          });
        });
      } catch {
        button.textContent = 'Nie udało się przygotować. Użyj „Otwórz JPG”.';
      }
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); prepare(); }
      }, { rootMargin: '350px' });
      observer.observe(article);
    } else {
      prepare();
    }
    actions.append(button);
  }
  actions.append(open, download);
  article.append(figure, element('h3', {}, artwork.title), element('p', { class: 'meta' }, `${artwork.width} × ${artwork.height} · JPG · ${Math.round(artwork.bytes / 1024)} KB`), actions);
  if (artwork.stickerLabel) {
    const sticker = element('div', { class: 'sticker-tools' });
    const label = element('p', {}, `Tekst naklejki: „${artwork.stickerLabel}”`);
    const link = element('input', { readonly: '', 'aria-label': `Link: ${artwork.title}`, value: artwork.storeUrl });
    const button = element('button', { type: 'button', class: 'secondary' }, 'Kopiuj link do storki');
    button.addEventListener('click', () => copy(artwork.storeUrl, link));
    sticker.append(label, link, button);
    article.append(sticker);
  }
  return article;
}

function caption(item) {
  const container = element('details', { class: 'caption' });
  const textarea = element('textarea', { readonly: '', 'aria-label': `Tekst: ${item.title}`, spellcheck: 'false' });
  textarea.value = item.text;
  const button = element('button', { type: 'button', class: 'secondary' }, 'Kopiuj tekst');
  button.addEventListener('click', () => copy(textarea.value, textarea));
  container.append(element('summary', {}, item.title), textarea, button, element('a', { href: `./teksty/${item.id}.txt`, download: '' }, 'Pobierz TXT'));
  return container;
}

try {
  const response = await fetch('./manifest.json?v=20260902');
  if (!response.ok) throw new Error('Manifest unavailable');
  const manifest = await response.json();
  for (const artwork of manifest.artworks) {
    const target = artwork.format === 'story' ? '#story-grid' : '#post-grid';
    document.querySelector(target).append(card(artwork));
  }
  for (const item of manifest.captions) document.querySelector('#caption-list').append(caption(item));
} catch {
  announce('Galeria nie mogła się wczytać. Możesz pobrać paczkę ZIP przyciskiem u góry.');
}
document.querySelector('#copy-store-link').addEventListener('click', () => copy('https://apps.apple.com/pl/app/chmurnik/id6782159027', document.querySelector('#store-link')));
