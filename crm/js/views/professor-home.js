// views/professor-home.js
const ProfessorHomeView = (() => {

  function render() {
    const user = Auth.requireRole('professor');
    if (!user) return '';

    const SEM     = Quota.CURRENT_SEMESTER;
    const usage   = Quota.getCurrentUsage(user.id, SEM);
    const limits  = Quota.QUOTA[user.grade] || Quota.QUOTA.New;

    const requests  = Store.getList('sample_requests').filter(r => r.professorId === user.id);
    const matReqs   = Store.getList('material_requests').filter(r => r.professorId === user.id);
    const adoptions = Store.getList('adoptions').filter(a => a.professorId === user.id);
    const notifs    = Store.getList('notifications').filter(n => n.userId === user.id && !n.read);

    const pendingReqs   = requests.filter(r => r.status === 'pending');
    const recent3Samples = [...requests].reverse().slice(0, 3);
    const recent3DLs     = [...matReqs].filter(r => r.downloadedAt).reverse().slice(0, 3);

    // 미인증 배너
    const verifyBanner = !user.verifiedAt ? `
      <div class="alert alert-accent" style="margin-bottom:16px">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div><strong>회원 인증 검토 중</strong> — 담당자 확인 후 서비스가 활성화됩니다.
          영업일 기준 1~2일 이내 처리됩니다.</div>
      </div>` : '';

    const notifBanner = notifs.length > 0 ? `
      <div class="alert alert-info" style="margin-bottom:16px">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div>읽지 않은 알림 <strong>${notifs.length}건</strong>
          ${notifs.map(n => `<div style="margin-top:3px;font-size:12px;color:var(--text-muted)">• ${n.message}</div>`).join('')}
        </div>
      </div>` : '';

    return `
      <div>
        ${verifyBanner}
        ${notifBanner}

        <!-- 웰컴 배너 -->
        <div class="welcome-banner" style="margin-bottom:24px">
          <div class="welcome-text">
            <h2>안녕하세요, ${user.name} ${user.title}님!</h2>
            <p>${user.university} ${user.department} · ${SEM} 학기</p>
            <p style="margin-top:8px;font-size:12px;opacity:0.75">
              ${Quota.QUOTA[user.grade]?.label || ''}
            </p>
          </div>
          <div class="grade-display">
            <div class="grade-circle">${user.grade}</div>
            <div class="grade-label">${Quota.GRADE_LABELS[user.grade] || ''}</div>
          </div>
        </div>

        <!-- KPI 카드 -->
        <div class="stats-grid" style="margin-bottom:24px">
          ${statCard('blue',  svgBook,     requests.length,             '총 견본 신청')}
          ${statCard('green', svgCheck,    adoptions.filter(a=>a.status==='confirmed').length, '확정 채택')}
          ${statCard('yellow',svgClock,    pendingReqs.length,          '처리 대기 중')}
          ${statCard('teal',  svgUsers,    user.students || 0,          '수강 학생 수')}
        </div>

        <div class="grid-2" style="margin-bottom:24px">
          <!-- 학기 한도 카드 -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">이번 학기 신청 현황 (${SEM})</span>
              <span class="badge badge-muted">${Quota.GRADE_LABELS[user.grade]}</span>
            </div>
            <div class="card-body">
              ${quotaBar('종이책 견본', usage.paper, limits.paper)}
              ${quotaBar('전자책 견본', usage.ebook, limits.ebook)}
              ${quotaBar('강의자료',   usage.material.size, limits.material)}
            </div>
            <div class="card-footer d-flex gap-8">
              <button class="btn btn-primary btn-sm"
                onclick="location.hash='#/professor/sample'">견본 신청</button>
              <button class="btn btn-outline btn-sm"
                onclick="location.hash='#/professor/materials'">강의자료</button>
            </div>
          </div>

          <!-- 최근 활동 -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">최근 활동</span>
              <button class="btn btn-ghost btn-sm"
                onclick="location.hash='#/professor/history'">전체보기</button>
            </div>
            <div class="card-body" style="padding:0">
              ${recentActivity(recent3Samples, recent3DLs)}
            </div>
          </div>
        </div>

        <!-- 빠른 메뉴 -->
        <div class="card">
          <div class="card-header"><span class="card-title">빠른 메뉴</span></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
              ${quickBtn('도서 둘러보기',    '최신 교재를 검색하세요',      '#/professor/books',    '#2E75B6')}
              ${quickBtn('견본 도서 신청',   '종이책·전자책 견본 신청',     '#/professor/sample',   '#1F4E79')}
              ${quickBtn('강의자료 다운로드','강의교안·연습문제 솔루션',    '#/professor/materials','#1B5E20')}
              ${quickBtn('내 신청·다운로드 내역','신청 현황 확인',          '#/professor/history',  '#4A148C')}
              ${quickBtn('채택 자기신고',    '이번 학기 채택 보고',         '#/professor/adoption', '#880E4F')}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── 헬퍼 ──────────────────────────────────────────────────────

  function quotaBar(label, usedN, limit) {
    const p   = Quota.pct(usedN, limit);
    const cls = Quota.fillClass(p);
    const display = limit === Infinity
      ? `<span style="color:var(--success);font-weight:600">제한 없음</span>`
      : `${usedN} / ${limit}`;
    return `
      <div class="quota-item">
        <div class="quota-header">
          <span class="quota-label">${label}</span>
          <span class="quota-value">${display}</span>
        </div>
        <div class="quota-bar">
          <div class="quota-fill ${cls}" style="width:${limit===Infinity?0:p}%"></div>
        </div>
      </div>`;
  }

  function statCard(color, iconSvg, value, label) {
    return `
      <div class="stat-card">
        <div class="stat-icon ${color}">${iconSvg}</div>
        <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>
      </div>`;
  }

  function recentActivity(samples, dls) {
    if (samples.length === 0 && dls.length === 0) {
      return '<div class="empty-state" style="padding:28px"><div class="empty-desc">최근 활동이 없습니다.</div></div>';
    }
    const books = Store.getList('books');
    const rows  = [];

    samples.forEach(r => {
      const b = books.find(bk => bk.id === r.bookId);
      const statusMap = { pending:'검토 중', approved:'승인', rejected:'반려' };
      const colorMap  = { pending:'badge-warning', approved:'badge-success', rejected:'badge-danger' };
      rows.push(`
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-light)">
          <div style="width:36px;height:36px;border-radius:6px;background:${b?.coverColor||'#999'};
            display:flex;align-items:center;justify-content:center;color:white;font-size:10px;
            font-weight:700;text-align:center;line-height:1.2;padding:2px;flex-shrink:0">📚</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;
              white-space:nowrap">${b ? b.title : r.bookId}</div>
            <div class="fs-xs text-muted">${r.requestedAt} · 견본 신청</div>
          </div>
          <span class="badge ${colorMap[r.status]}">${statusMap[r.status]}</span>
        </div>`);
    });

    dls.forEach(r => {
      const b = books.find(bk => bk.id === r.bookId);
      rows.push(`
        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-light)">
          <div style="width:36px;height:36px;border-radius:6px;background:${b?.coverColor||'#999'};
            display:flex;align-items:center;justify-content:center;color:white;font-size:10px;
            font-weight:700;text-align:center;line-height:1.2;padding:2px;flex-shrink:0">📄</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;
              white-space:nowrap">${b ? b.title : r.bookId}</div>
            <div class="fs-xs text-muted">${r.downloadedAt} · 강의자료 다운로드</div>
          </div>
          <span class="badge badge-success">완료</span>
        </div>`);
    });

    return rows.join('') + `
      <div style="padding:10px 16px">
        <button class="btn btn-ghost btn-sm" style="width:100%" onclick="location.hash='#/professor/history'">
          전체 내역 보기 →
        </button>
      </div>`;
  }

  function quickBtn(title, desc, hash, color) {
    return `
      <button class="btn btn-ghost" style="display:flex;flex-direction:column;align-items:flex-start;
        padding:14px 16px;border:1px solid var(--border-light);border-radius:var(--radius);
        height:auto;gap:3px;text-align:left" onclick="location.hash='${hash}'">
        <span style="font-weight:700;color:${color};font-size:13px">${title}</span>
        <span style="font-size:12px;color:var(--text-muted)">${desc}</span>
      </button>`;
  }

  // SVG 아이콘
  const svgBook  = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
  const svgCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  const svgClock = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const svgUsers = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  function attach() {}

  return { render, attach };
})();
