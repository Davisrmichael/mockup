export function wireUI({ onChooseFile, onClear, onExport }) {
  const file = document.getElementById('file');
  const clearBtn = document.getElementById('clear');
  const exportBtn = document.getElementById('export');
  const bright = document.getElementById('bright');

  if (!file || !clearBtn || !exportBtn || !bright) {
    throw new Error('UI elements not found. Did the HTML change?');
  }

  file.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    await onChooseFile(f, !!bright.checked);
    file.title = f.name;
  });

  clearBtn.addEventListener('click', () => {
    onClear();
    file.value = '';
    file.title = '';
  });

  exportBtn.addEventListener('click', () => onExport());
}
