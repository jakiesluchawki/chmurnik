const status = document.getElementById('status');
const libraryLink = document.createElement('a');
libraryLink.href = '../../assetySM/';
libraryLink.textContent = 'Wszystkie materiały SM';
document.querySelector('header>span').replaceWith(libraryLink);
document.querySelector('header>a').href = libraryLink.href;
let timer;
function notify(message) {
  status.textContent = message;
  status.classList.add('visible');
  clearTimeout(timer);
  timer = setTimeout(() => status.classList.remove('visible'), 4500);
}
document.querySelectorAll('.copy-link').forEach(button => button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.dataset.link); notify('Link do naklejki skopiowany.'); }
  catch { const input=button.parentElement.querySelector('input'); input.focus(); input.select(); notify('Zaznaczony link możesz skopiować ręcznie.'); }
}));
document.querySelectorAll('.share').forEach(button => button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const response=await fetch(button.dataset.file);
    if (!response.ok) throw Error('Download failed');
    const file=new File([await response.blob()],button.dataset.file.split('/').pop(),{type:'image/png'});
    if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file]});
    else { const link=document.createElement('a'); link.href=button.dataset.file; link.download=file.name; link.click(); notify('Pobrano PNG. Wgraj go z galerii lub plików do Instagrama.'); }
  } catch (error) { if(error.name!=='AbortError')notify('Użyj przycisku „Pobierz PNG” obok.'); }
  finally { button.disabled = false; }
}));
