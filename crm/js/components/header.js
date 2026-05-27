// header.js
const Header = (() => {
  let _listenerAttached = false;

  function _pendingCounts() {
    const verifyCount = Store.getList('users')
      .filter(u => u.role === 'professor' && !u.verifiedAt && !u.isTemp && u.verificationStatus !== 'rejected').length;
    const sampleCount = Store.getList('sample_requests').filter(r => r.status === 'pending').length;
    const adoptCount  = Store.getList('adoptions').filter(a => a.status === 'pending').length;
    return { verifyCount, sampleCount, adoptCount, total: verifyCount + sampleCount + adoptCount };
  }

  function render(title, breadcrumb) {
    breadcrumb = breadcrumb || '';
    const user    = Auth.current();
    const isAdmin = user && (user.role === 'admin' || user.role === 'sales');

    let notifHtml = '';
    if (isAdmin) {
      const c = _pendingCounts();
      notifHtml = `
        <div class="notif-wrapper" id="notif-wrapper">
          <button class="notif-bell" onclick="Header.toggleNotif(event)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            ${c.total > 0 ? `<span class="notif-count">${c.total}</span>` : ''}
          </button>
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-dropdown-header">미처리 알림</div>
            <div class="notif-dropdown-item" onclick="location.hash='#/admin/verification';Header.closeNotif()">
              <span>회원 인증 대기</span>
              <span class="notif-item-cnt${c.verifyCount === 0 ? ' zero' : ''}">${c.verifyCount}건</span>
            </div>
            <div class="notif-dropdown-item" onclick="location.hash='#/admin/sample-approval';Header.closeNotif()">
              <span>견본 승인 대기</span>
              <span class="notif-item-cnt${c.sampleCount === 0 ? ' zero' : ''}">${c.sampleCount}건</span>
            </div>
            <div class="notif-dropdown-item" onclick="location.hash='#/admin/adoption-review';Header.closeNotif()">
              <span>채택 검토 대기</span>
              <span class="notif-item-cnt${c.adoptCount === 0 ? ' zero' : ''}">${c.adoptCount}건</span>
            </div>
          </div>
        </div>`;
    } else if (user) {
      const unread = Store.getList('notifications').filter(n => n.userId === user.id && !n.read).length;
      if (unread > 0) {
        notifHtml = `
          <div class="header-chip" style="color:var(--danger);background:var(--danger-bg)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            미읽 ${unread}건
          </div>`;
      }
    }

    return `
      <header class="header">
        <div class="header-title">
          ${title}
          ${breadcrumb ? `<span class="breadcrumb">/ ${breadcrumb}</span>` : ''}
        </div>
        <div class="header-actions">
          ${user ? `
            <div class="header-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              ${user.name} ${user.title || ''}
            </div>` : ''}
          ${notifHtml}
        </div>
      </header>`;
  }

  function toggleNotif(e) {
    e.stopPropagation();
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.toggle('open');
  }

  function closeNotif() {
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.remove('open');
  }

  function attach() {
    if (!_listenerAttached) {
      document.addEventListener('click', function(e) {
        const wrapper = document.getElementById('notif-wrapper');
        if (wrapper && !wrapper.contains(e.target)) closeNotif();
      });
      _listenerAttached = true;
    }
  }

  return { render, attach, toggleNotif, closeNotif };
})();
