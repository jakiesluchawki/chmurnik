const status = document.getElementById('status');
if (document.getElementById('tapety')) {
  const link=document.createElement('a');link.href='#tapety';link.textContent='Tapety 4K';
  document.querySelector('.platform-nav').append(link);
}
let timer;
function notify(message) {
  status.textContent = message;
  status.classList.add('visible');
  clearTimeout(timer);
  timer = setTimeout(() => status.classList.remove('visible'), 4500);
}
document.querySelectorAll('.copy-post').forEach(button => button.addEventListener('click', async () => {
  const content = document.getElementById(button.dataset.target);
  try { await navigator.clipboard.writeText(content.textContent); notify(button.dataset.target==='wallpaper-share-link'?'Link do tapet skopiowany.':'Cały post skopiowany.'); }
  catch {
    const range = document.createRange(); range.selectNodeContents(content);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    content.focus(); notify('Zaznaczony tekst możesz skopiować ręcznie lub pobrać jako TXT.');
  }
}));
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
