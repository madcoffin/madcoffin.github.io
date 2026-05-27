// views/admin-sample-approval.js
const AdminSampleApprovalView = (() => {
  let _filter = 'pending';

  function _isException(req) {
    if (req.type !== 'paper') return false;
    const prof = Store.findById('users', req.professorId);
    if (!prof) return false;
    const grade = prof.grade || 'New';
    const limit = (Quota.QUOTA[grade] || Quota.QUOTA.New).paper;
    if (limit === Infinity) return false;
    const approvedCount = Store.getList('sample_requests').filter(r =>
      r.professorId === req.professorId &&
      r.semester    === req.semester &&
      r.type        === 'paper' &&
      r.status      === 'approved' &&
      r.id          !== req.id
    ).length;
    return approvedCount >= limit;
  }

  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const allReqs = Store.getList('sample_requests');
    const matReqs = Store.getList('material_requests');
    const filtered = _filter === 'all' ? allReqs : allReqs.filter(r => r.status === _filter);

    const counts = {
      all:      allReqs.length,
      pending:  allReqs.filter(r => r.status === 'pending').length,
      approved: allReqs.filter(r => r.status === 'approved').length,
      rejected: allReqs.filter(r => r.status === 'rejected').length,
    };

    const matPending = matReqs.filter(r => r.status === 'pending');

    return `
      <div>
        <div class="page-header">
          <div class="page-title">견본 도서 승인</div>
          <div class="page-desc">교강사 견본 신청을 검토하고 승인 / 반려합니다.</div>
        </div>

        <div class="tabs">
          ${[['pending','검토 대기'],['approved','승인'],['rejected','반려'],['all','전체']].map(([val,label]) =>
            `<button class="tab-btn${_filter===val?' active':''}" data-filter="${val}">
              ${label}
              <span class="badge ${val==='pending'?'badge-warning':val==='approved'?'badge-success':val==='rejected'?'badge-danger':'badge-muted'}">${counts[val]}</span>
            </button>`
          ).join('')}
        </div>

        <div class="card mb-20">
          <div class="card-header"><span class="card-title">견본 도서 신청 목록</span></div>
          <div class="card-body p-0">
            ${filtered.length === 0
              ? '<div class="empty-state" style="padding:40px"><div class="empty-desc">해당 상태의 신청이 없습니다.</div></div>'
              : `<table class="data-table">
                  <thead>
                    <tr><th>신청일</th><th>교강사</th><th>도서</th><th>유형</th><th>학기</th><th>상태</th><th>작업</th></tr>
                  </thead>
                  <tbody>
                    ${[...filtered].reverse().map(r => {
                      const prof = Store.findById('users', r.professorId);
                      const book = Store.findById('books', r.bookId);
                      const exc  = _isException(r);
                      return `<tr>
                        <td class="fs-sm text-muted">${r.requestedAt}</td>
                        <td>
                          <div style="font-weight:600;font-size:13px">${prof ? prof.name : r.professorId}</div>
                          <div class="fs-xs text-muted">${prof ? prof.university : ''}</div>
                        </td>
                        <td style="max-width:160px">
                          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500">${book ? book.title : r.bookId}</div>
                        </td>
                        <td>
                          ${r.type === 'paper'
                            ? '<span class="badge badge-primary">종이책</span>'
                            : '<span class="badge badge-info">전자책</span>'}
                          ${exc ? `<span class="badge badge-exception" style="margin-left:4px">할당초과</span>` : ''}
                        </td>
                        <td class="fs-sm">${r.semester}</td>
                        <td>
                          ${_statusBadge(r.status)}
                          ${r.isException ? `<div class="fs-xs text-muted" style="margin-top:2px">예외승인: ${r.exceptionReason || ''}</div>` : ''}
                          ${r.rejectReason ? `<div class="fs-xs text-muted" style="margin-top:2px">반려: ${r.rejectReason}</div>` : ''}
                        </td>
                        <td>
                          ${r.status === 'pending' ? `
                            <div style="display:flex;gap:6px">
                              <button class="btn btn-success btn-sm" onclick="AdminSampleApprovalView.processApprove('${r.id}')">승인</button>
                              <button class="btn btn-danger btn-sm" onclick="AdminSampleApprovalView.showRejectModal('${r.id}')">반려</button>
                            </div>` : r.status === 'approved' ? `
                            <button class="btn btn-outline-gray btn-sm" onclick="AdminSampleApprovalView.showRejectModal('${r.id}')">반려 전환</button>` : `
                            <button class="btn btn-outline btn-sm" onclick="AdminSampleApprovalView.processApprove('${r.id}')">재승인</button>`}
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>`}
          </div>
        </div>

        ${matPending.length > 0 ? `
        <div class="card">
          <div class="card-header"><span class="card-title">강의자료 신청 대기 (${matPending.length}건)</span></div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead><tr><th>신청일</th><th>교강사</th><th>도서</th><th>강의계획서</th><th>상태</th><th>작업</th></tr></thead>
              <tbody>
                ${matPending.map(r => {
                  const prof = Store.findById('users', r.professorId);
                  const book = Store.findById('books', r.bookId);
                  return `<tr>
                    <td class="fs-sm text-muted">${r.requestedAt}</td>
                    <td class="fs-sm">${prof ? prof.name : r.professorId}</td>
                    <td style="max-width:140px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${book ? book.title : r.bookId}</div></td>
                    <td class="fs-sm">${r.coursePlanFile || '-'}</td>
                    <td>${_statusBadge(r.status)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-success btn-sm" onclick="AdminSampleApprovalView.processMat('${r.id}','approved')">승인</button>
                        <button class="btn btn-danger btn-sm" onclick="AdminSampleApprovalView.processMat('${r.id}','rejected')">반려</button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
      </div>`;
  }

  function _statusBadge(s) {
    const m = {
      pending:  '<span class="badge badge-warning">검토 중</span>',
      approved: '<span class="badge badge-success">승인</span>',
      rejected: '<span class="badge badge-danger">반려</span>',
    };
    return m[s] || s;
  }

  function processApprove(reqId) {
    const req = Store.findById('sample_requests', reqId);
    if (!req) return;

    if (_isException(req)) {
      Modal.open({
        title: '예외 승인 처리',
        body: `
          <div class="alert alert-warning" style="margin-bottom:14px">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>이 신청은 해당 교강사의 현재 할당량을 초과합니다. 예외 승인 사유를 입력하세요.</div>
          </div>
          <div class="form-group">
            <label class="form-label">예외 승인 사유 <span class="required">*</span></label>
            <textarea id="exception-reason" class="form-control" rows="3"
              placeholder="예외 승인 사유를 상세히 입력하세요 (필수)"></textarea>
          </div>`,
        footer: `
          <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
          <button class="btn btn-warning" onclick="AdminSampleApprovalView.doExceptionApprove('${reqId}')">예외 승인</button>`,
      });
    } else {
      Modal.confirm({
        title: '견본 신청 승인',
        message: '이 견본 신청을 승인하시겠습니까?',
        confirmText: '승인',
        onConfirm: () => {
          const r = Store.findById('sample_requests', reqId);
          if (!r) return;
          r.status      = 'approved';
          r.processedAt = new Date().toISOString().slice(0, 10);
          Store.upsert('sample_requests', r);
          Toast.success('견본 신청이 승인되었습니다.');
          Router.refresh();
        },
      });
    }
  }

  function doExceptionApprove(reqId) {
    const reason = (document.getElementById('exception-reason') || {}).value || '';
    if (!reason.trim()) {
      Toast.warning('예외 승인 사유를 입력해주세요.');
      return;
    }
    const r = Store.findById('sample_requests', reqId);
    if (!r) return;
    r.status          = 'approved';
    r.processedAt     = new Date().toISOString().slice(0, 10);
    r.isException     = true;
    r.exceptionReason = reason.trim();
    Store.upsert('sample_requests', r);
    Modal.close();
    Toast.success('예외 승인이 처리되었습니다.');
    Router.refresh();
  }

  function showRejectModal(reqId) {
    Modal.open({
      title: '견본 신청 반려',
      body: `
        <div class="form-group">
          <label class="form-label">반려 사유 <span class="required">*</span></label>
          <textarea id="reject-reason" class="form-control" rows="3"
            placeholder="반려 사유를 입력하세요 (필수)"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
        <button class="btn btn-danger" onclick="AdminSampleApprovalView.doReject('${reqId}')">반려</button>`,
    });
  }

  function doReject(reqId) {
    const reason = (document.getElementById('reject-reason') || {}).value || '';
    if (!reason.trim()) {
      Toast.warning('반려 사유를 입력해주세요.');
      return;
    }
    const r = Store.findById('sample_requests', reqId);
    if (!r) return;
    r.status       = 'rejected';
    r.processedAt  = new Date().toISOString().slice(0, 10);
    r.rejectReason = reason.trim();
    Store.upsert('sample_requests', r);
    Modal.close();
    Toast.info('견본 신청이 반려되었습니다.');
    Router.refresh();
  }

  function processMat(reqId, newStatus) {
    const action = newStatus === 'approved' ? '승인' : '반려';
    const req = Store.findById('material_requests', reqId);
    if (!req) return;
    req.status      = newStatus;
    req.processedAt = new Date().toISOString().slice(0, 10);
    Store.upsert('material_requests', req);
    Toast.success(`강의자료 신청이 ${action}되었습니다.`);
    Router.refresh();
  }

  function attach() {
    document.querySelectorAll('.tab-btn[data-filter]').forEach(btn => {
      btn.onclick = () => { _filter = btn.dataset.filter; Router.refresh(); };
    });
  }

  return { render, attach, processApprove, doExceptionApprove, showRejectModal, doReject, processMat };
})();
