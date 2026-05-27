// sidebar.js
const Sidebar = (() => {
  function navItem(icon, label, hash, currentHash, badge) {
    const base   = currentHash.split('?')[0];
    const active = (base === hash || base.startsWith(hash + '/')) ? ' active' : '';
    return `<button class="nav-item${active}" onclick="location.hash='${hash}'">
      <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
      ${label}
      ${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}
    </button>`;
  }

  const I = {
    home:    '<rect x="3" y="9" width="18" height="11" rx="2"/><polyline points="3 9 12 3 21 9"/>',
    books:   '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    inbox:   '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    file:    '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
    dl:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    hist:    '<polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>',
    check:   '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    users:   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart:   '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    sim:     '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
    verify:  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    approve: '<path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>',
    policy:  '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    bookdb:  '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  };

  function render(currentHash) {
    const user = Auth.current();
    if (!user) return '';

    const pendingSamples = Store.getList('sample_requests').filter(r => r.status === 'pending').length;
    const pendingVerify  = Store.getList('users').filter(u => u.role === 'professor' && !u.verifiedAt && !u.isTemp && u.verificationStatus !== 'rejected').length;
    const pendingAdopt   = Store.getList('adoptions').filter(a => a.status === 'pending').length;
    const unreadNotifs   = Store.getList('notifications').filter(n => n.userId === user.id && !n.read).length;

    let navHtml = '';

    if (user.role === 'professor') {
      navHtml = `
        <div class="nav-section">
          <div class="nav-section-title">교강사 서비스</div>
          ${navItem(I.home,  '내 홈',           '#/professor/home',      currentHash, unreadNotifs)}
          ${navItem(I.books, '도서 둘러보기',    '#/professor/books',     currentHash)}
          ${navItem(I.inbox, '견본 도서 신청',   '#/professor/sample',    currentHash)}
          ${navItem(I.dl,    '강의자료 다운로드','#/professor/materials',  currentHash)}
          ${navItem(I.check, '채택 자기신고',    '#/professor/adoption',  currentHash)}
          ${navItem(I.hist,  '내 신청·다운로드 내역','#/professor/history',currentHash)}
        </div>`;
    } else {
      navHtml = `
        <div class="nav-section">
          <div class="nav-section-title">관리</div>
          ${navItem(I.home,    '관리 홈',    '#/admin/home',             currentHash)}
          ${navItem(I.verify,  '회원 검증',  '#/admin/verification',     currentHash, pendingVerify)}
          ${navItem(I.approve, '견본 승인',  '#/admin/sample-approval',  currentHash, pendingSamples)}
          ${navItem(I.users,   '교강사 조회','#/admin/professors',        currentHash)}
          ${navItem(I.check,   '채택 확인',  '#/admin/adoption-review',  currentHash, pendingAdopt)}
        </div>
        <div class="nav-section">
          <div class="nav-section-title">분석</div>
          ${navItem(I.chart, '대시보드',          '#/dashboard',       currentHash)}
          ${navItem(I.sim,   '등급 시뮬레이터',    '#/grade-simulator', currentHash)}
        </div>
        <div class="nav-section">
          <div class="nav-section-title">설정</div>
          ${navItem(I.policy, '한도 정책',   '#/admin/policy', currentHash)}
          ${navItem(I.bookdb, '도서 관리',   '#/admin/books',  currentHash)}
        </div>`;
    }

    return `
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="brand">한빛아카데미</span>
          <span class="sub">${user.role === 'professor' ? '교수 전용 공간' : '교강사 서비스 CRM'}</span>
        </div>
        <div class="sidebar-user">
          <div class="user-name">
            ${user.name}
            ${user.grade ? `<span class="grade-badge grade-${user.grade}">${Quota.GRADE_LABELS[user.grade] || user.grade}</span>` : ''}
          </div>
          <div class="user-role">
            ${user.university || user.title || ''}${user.department ? ' · ' + user.department : ''}
          </div>
        </div>
        ${navHtml}
        <div class="sidebar-footer">
          <button class="logout-btn" onclick="Auth.logout(); location.hash='#/login'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">${I.logout}</svg>
            로그아웃
          </button>
        </div>
      </aside>`;
  }

  function toggleMobile() {
    document.body.classList.toggle('sidebar-open');
  }

  function closeMobile() {
    document.body.classList.remove('sidebar-open');
  }

  return { render, toggleMobile, closeMobile };
})();
