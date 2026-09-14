let noticeTimer;
document.addEventListener('click', async event => {
  const button = event.target.closest('button[data-copy]');
  if (!button) return;
  const source = document.getElementById(button.dataset.copy);
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(source.textContent);
    status.textContent = 'Skopiowano cały tekst.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Zaznaczono tekst. Użyj opcji Kopiuj albo pobierz TXT.';
  }
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { status.textContent = ''; }, 6000);
});
