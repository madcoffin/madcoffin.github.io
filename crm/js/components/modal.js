// modal.js
const Modal = (() => {
  let _el = null;

  function _onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function open({ title, body, footer = '', size = '', onClose }) {
    close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal${size ? ' modal-' + size : ''}">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>`;
    overlay.querySelector('.modal-close').onclick = () => { close(); if (onClose) onClose(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) { close(); if (onClose) onClose(); } });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', _onKeydown);
    _el = overlay;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return overlay;
  }

  function close() {
    if (_el) { _el.remove(); _el = null; }
    document.removeEventListener('keydown', _onKeydown);
  }

  function confirm({ title, message, onConfirm, confirmText = '확인', danger = false }) {
    open({
      title,
      size: 'sm',
      body: `<p style="font-size:14px;color:var(--text)">${message}</p>`,
      footer: `
        <button class="btn btn-outline-gray" id="modal-cancel-btn">취소</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirmText}</button>`,
    });
    document.getElementById('modal-cancel-btn').onclick = close;
    document.getElementById('modal-confirm-btn').onclick = () => { close(); if (onConfirm) onConfirm(); };
  }

  return { open, close, confirm };
})();
