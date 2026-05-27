// views/admin-adoption-review.js
const AdminAdoptionReviewView = (() => {
  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const adoptions  = Store.getList('adoptions');
    const professors = Store.getList('users').filter(u => u.role === 'professor');
    const books      = Store.getList('books');

    const pending   = adoptions.filter(a => a.status === 'pending');
    const confirmed = adoptions.filter(a => a.status === 'confirmed');
    const rejected  = adoptions.filter(a => a.status === 'rejected');

    const totalStudents = confirmed.reduce((sum, a) => sum + (a.students || 0), 0);
    const topBook = (() => {
      const cnt = {};
      confirmed.forEach(a => { cnt[a.bookId] = (cnt[a.bookId] || 0) + 1; });
      const topId = Object.entries(cnt).sort((x,y) => y[1]-x[1])[0];
      if (!topId) return null;
      const b = books.find(bk => bk.id === topId[0]);
      return b ? { title: b.title, count: topId[1] } : null;
    })();

    function profRow(a, actions) {
      const p = professors.find(pr => pr.id === a.professorId);
      const b = books.find(bk => bk.id === a.bookId);
      return `<tr>
        <td class="fs-sm text-muted">${a.reportedAt || a.confirmedAt || '-'}</td>
        <td>
          <div style="font-weight:600;font-size:13px">${p ? p.name : a.professorId}</div>
          <div class="fs-xs text-muted">${p ? p.university : ''}</div>
        </td>
        <td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${b ? b.title : a.bookId}</div></td>
        <td class="fs-sm">${a.semester}</td>
        <td class="fs-sm">${a.courseName || '-'}</td>
        <td class="text-center fw-bold">${a.students || '-'}</td>
        <td class="fs-sm">${a.sections ? a.sections + '분반' : '-'}</td>
        <td class="fs-sm">${a.coursePlanFile ? `<span class="fs-xs" style="color:var(--secondary)">📎 ${a.coursePlanFile}</span>` : '-'}</td>
        <td>${actions}</td>
      </tr>`;
    }

    return `
      <div>
        <div class="page-header">
          <div class="page-title">채택 확인</div>
          <div class="page-desc">교강사 채택 보고를 확인하고 확정합니다.</div>
        </div>

        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
          <div class="stat-card">
            <div class="stat-icon yellow"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div><div class="stat-value">${pending.length}</div><div class="stat-label">확인 대기</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div><div class="stat-value">${confirmed.length}</div><div class="stat-label">확정 채택</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div><div class="stat-value">${totalStudents.toLocaleString()}</div><div class="stat-label">총 수강생</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <div><div class="stat-value">${rejected.length}</div><div class="stat-label">반려</div></div>
          </div>
        </div>

        ${pending.length > 0 ? `
        <div class="card mb-20">
          <div class="card-header">
            <span class="card-title" style="color:var(--warning)">확인 대기 (${pending.length}건)</span>
            ${pending.length > 1 ? `<button class="btn btn-success btn-sm" onclick="AdminAdoptionReviewView.confirmAll()">전체 확정</button>` : ''}
          </div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead><tr><th>보고일</th><th>교강사</th><th>도서</th><th>학기</th><th>강의명</th><th>학생수</th><th>분반</th><th>강의계획서</th><th>작업</th></tr></thead>
              <tbody>
                ${pending.map(a => profRow(a, `
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-success btn-sm" onclick="AdminAdoptionReviewView.confirm('${a.id}')">확정</button>
                    <button class="btn btn-danger btn-sm" onclick="AdminAdoptionReviewView.showRejectModal('${a.id}')">반려</button>
                  </div>`)).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}

        <div class="card mb-20">
          <div class="card-header">
            <span class="card-title">확정 채택 이력 (${confirmed.length}건)</span>
            ${topBook ? `<span class="fs-sm text-muted">최다 채택: ${topBook.title} (${topBook.count}회)</span>` : ''}
          </div>
          <div class="card-body p-0">
            ${confirmed.length === 0
              ? '<div class="empty-state" style="padding:30px"><div class="empty-desc">확정된 채택이 없습니다.</div></div>'
              : `<table class="data-table">
                  <thead><tr><th>확정일</th><th>교강사</th><th>도서</th><th>학기</th><th>강의명</th><th>학생수</th><th>분반</th><th>강의계획서</th><th></th></tr></thead>
                  <tbody>
                    ${[...confirmed].reverse().map(a => profRow(a, '')).join('')}
                  </tbody>
                </table>`}
          </div>
        </div>

        ${rejected.length > 0 ? `
        <div class="card">
          <div class="card-header"><span class="card-title" style="color:var(--danger)">반려 이력 (${rejected.length}건)</span></div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead><tr><th>보고일</th><th>교강사</th><th>도서</th><th>학기</th><th>강의명</th><th>학생수</th><th>분반</th><th>강의계획서</th><th>반려사유</th></tr></thead>
              <tbody>
                ${rejected.map(a => {
                  const p = professors.find(pr => pr.id === a.professorId);
                  const b = books.find(bk => bk.id === a.bookId);
                  return `<tr>
                    <td class="fs-sm text-muted">${a.reportedAt || '-'}</td>
                    <td>
                      <div style="font-weight:600;font-size:13px">${p ? p.name : a.professorId}</div>
                      <div class="fs-xs text-muted">${p ? p.university : ''}</div>
                    </td>
                    <td style="max-width:140px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${b ? b.title : a.bookId}</div></td>
                    <td class="fs-sm">${a.semester}</td>
                    <td class="fs-sm">${a.courseName || '-'}</td>
                    <td class="text-center fw-bold">${a.students || '-'}</td>
                    <td class="text-center">${a.sections ? a.sections + '분반' : '-'}</td>
                    <td class="fs-sm">${a.coursePlanFile || '-'}</td>
                    <td class="fs-sm text-muted">${a.rejectReason || '-'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
      </div>`;
  }

  function confirm(adoptId) {
    const a = Store.findById('adoptions', adoptId);
    if (!a) return;
    a.status      = 'confirmed';
    a.confirmedAt = new Date().toISOString().slice(0, 10);
    Store.upsert('adoptions', a);
    Toast.success('채택이 확정되었습니다.');
    Router.refresh();
  }

  function showRejectModal(adoptId) {
    Modal.open({
      title: '채택 보고 반려',
      body: `
        <div class="form-group">
          <label class="form-label">반려 사유 <span class="required">*</span></label>
          <textarea id="adopt-reject-reason" class="form-control" rows="3"
            placeholder="반려 사유를 입력하세요 (필수)"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
        <button class="btn btn-danger" onclick="AdminAdoptionReviewView.doReject('${adoptId}')">반려 처리</button>`,
    });
  }

  function doReject(adoptId) {
    const reason = (document.getElementById('adopt-reject-reason') || {}).value || '';
    if (!reason.trim()) {
      Toast.warning('반려 사유를 입력해주세요.');
      return;
    }
    const a = Store.findById('adoptions', adoptId);
    if (!a) return;
    a.status       = 'rejected';
    a.rejectReason = reason.trim();
    a.processedAt  = new Date().toISOString().slice(0, 10);
    Store.upsert('adoptions', a);
    Modal.close();
    Toast.info('채택 보고가 반려되었습니다.');
    Router.refresh();
  }

  function confirmAll() {
    Modal.confirm({
      title: '전체 확정',
      message: '대기 중인 모든 채택 보고를 확정하시겠습니까?',
      confirmText: '전체 확정',
      onConfirm: () => {
        const today = new Date().toISOString().slice(0, 10);
        const all   = Store.getList('adoptions');
        all.forEach(a => {
          if (a.status === 'pending') {
            a.status      = 'confirmed';
            a.confirmedAt = today;
          }
        });
        Store.setList('adoptions', all);
        Toast.success('전체 채택이 확정되었습니다.');
        Router.refresh();
      },
    });
  }

  function attach() {}
  return { render, attach, confirm, showRejectModal, doReject, confirmAll };
})();
