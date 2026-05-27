// views/admin-home.js
const AdminHomeView = (() => {
  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const professors    = Store.getList('users').filter(u => u.role === 'professor');
    const samples       = Store.getList('sample_requests');
    const adoptions     = Store.getList('adoptions');
    const pending       = samples.filter(s => s.status === 'pending');
    const pendingVerify = professors.filter(p => !p.verifiedAt);
    const pendingAdopt  = adoptions.filter(a => a.status === 'pending');

    const gradeCount = {};
    professors.forEach(p => { gradeCount[p.grade] = (gradeCount[p.grade] || 0) + 1; });

    const recentSamples = [...samples].reverse().slice(0, 6);

    return `
      <div>
        <div class="page-header">
          <div class="page-title">관리 홈</div>
          <div class="page-desc">${new Date().toLocaleDateString('ko-KR', {year:'numeric',month:'long',day:'numeric'})} 기준</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div><div class="stat-value">${professors.length}</div><div class="stat-label">등록 교강사</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div><div class="stat-value">${pending.length}</div><div class="stat-label">견본 승인 대기</div><div class="stat-change down">즉시 처리 필요</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <div><div class="stat-value">${pendingVerify.length}</div><div class="stat-label">회원 검증 대기</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div><div class="stat-value">${adoptions.filter(a=>a.status==='confirmed').length}</div><div class="stat-label">확정 채택 건수</div></div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <span class="card-title">등급별 교강사 현황</span>
              <button class="btn btn-ghost btn-sm" onclick="location.hash='#/admin/professors'">전체보기</button>
            </div>
            <div class="card-body">
              ${['S','A','B','C','New','Inactive'].map(g => {
                const cnt = gradeCount[g] || 0;
                const max = Math.max(...Object.values(gradeCount), 1);
                const pct = Math.round(cnt / max * 100);
                return `<div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                    <span style="display:flex;align-items:center;gap:8px">
                      <span class="grade-badge grade-${g}">${Quota.GRADE_LABELS[g]}</span>
                    </span>
                    <span style="font-size:13px;font-weight:600">${cnt}명</span>
                  </div>
                  <div class="quota-bar"><div class="quota-fill ok" style="width:${pct}%"></div></div>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">최근 견본 신청</span>
              <button class="btn btn-ghost btn-sm" onclick="location.hash='#/admin/sample-approval'">전체보기</button>
            </div>
            <div class="card-body p-0">
              <table class="data-table">
                <thead><tr><th>교수</th><th>도서</th><th>유형</th><th>상태</th></tr></thead>
                <tbody>
                  ${recentSamples.map(r => {
                    const prof = Store.findById('users', r.professorId);
                    const book = Store.findById('books', r.bookId);
                    return `<tr>
                      <td class="fs-sm">${prof ? prof.name : r.professorId}</td>
                      <td style="max-width:120px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${book ? book.title : r.bookId}</div></td>
                      <td>${r.type === 'paper' ? '<span class="badge badge-primary">종이</span>' : '<span class="badge badge-info">전자</span>'}</td>
                      <td>${r.status === 'pending' ? '<span class="badge badge-warning">대기</span>' : r.status === 'approved' ? '<span class="badge badge-success">승인</span>' : '<span class="badge badge-danger">반려</span>'}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">빠른 작업</span></div>
          <div class="card-body">
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="location.hash='#/admin/verification'">
                회원 검증 처리 ${pendingVerify.length > 0 ? `<span class="nav-badge" style="background:var(--danger)">${pendingVerify.length}</span>` : ''}
              </button>
              <button class="btn btn-secondary" onclick="location.hash='#/admin/sample-approval'">
                견본 승인 처리 ${pending.length > 0 ? `<span class="nav-badge" style="background:var(--danger)">${pending.length}</span>` : ''}
              </button>
              <button class="btn btn-outline" onclick="location.hash='#/admin/adoption-review'">
                채택 확인 ${pendingAdopt.length > 0 ? `<span class="nav-badge">${pendingAdopt.length}</span>` : ''}
              </button>
              <button class="btn btn-outline-gray" onclick="location.hash='#/dashboard'">대시보드 보기</button>
              <button class="btn btn-outline-gray" onclick="location.hash='#/grade-simulator'">등급 시뮬레이터</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function attach() {}
  return { render, attach };
})();
