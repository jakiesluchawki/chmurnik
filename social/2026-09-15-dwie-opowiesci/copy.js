document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy);
    const text = source.value || source.textContent;
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Skopiowano całość';
    } catch {
      button.textContent = 'Użyj pliku TXT poniżej';
    }
    button.setAttribute('aria-live', 'polite');
    setTimeout(() => { button.textContent = label; }, 3000);
  });
});
