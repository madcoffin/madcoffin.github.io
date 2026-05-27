// toast.js
const Toast = (() => {
  function show(msg, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon" data-lucide="${icons[type] || 'info'}"></span>
      <span>${msg}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(el);
    if (typeof lucide !== 'undefined') lucide.createIcons({ el });
    setTimeout(() => { if (el.parentElement) el.remove(); }, duration);
  }

  return {
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error',   d),
    warning: (m, d) => show(m, 'warning', d),
    info:    (m, d) => show(m, 'info',    d),
  };
})();
