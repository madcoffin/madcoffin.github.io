// views/admin-verification.js
const AdminVerificationView = (() => {
  let _selectedId = null;
  let _query = '';

  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    if (params.get('id')) _selectedId = params.get('id');

    const professors = Store.getList('users')
      .filter(u => u.role === 'professor' && !u.isTemp)
      .sort((a, b) => {
        const aP = !a.verifiedAt && a.verificationStatus !== 'rejected';
        const bP = !b.verifiedAt && b.verificationStatus !== 'rejected';
        if (aP && !bP) return -1;
        if (!aP && bP) return 1;
        return 0;
      });

    const filtered = professors.filter(p =>
      !_query || p.name.includes(_query) || (p.university || '').includes(_query)
    );

    const selected = _selectedId ? professors.find(p => p.id === _selectedId) : null;

    return `
      <div>
        <div class="page-header">
          <div class="page-title">회원 검증</div>
          <div class="page-desc">신규 교강사 회원 전환 신청을 검토하고 승인합니다.</div>
        </div>
        <div class="admin-split">
          <div class="admin-list-panel">
            <div class="admin-list-search">
              <input id="verif-search" class="form-control" type="text"
                placeholder="성명·소속 검색..." value="${_query}" style="font-size:13px">
            </div>
            <div class="admin-list-items">
              ${filtered.length === 0
                ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">검색 결과 없음</div>`
                : filtered.map(p => {
                    const isPending  = !p.verifiedAt && p.verificationStatus !== 'rejected';
                    const isRejected = p.verificationStatus === 'rejected';
                    return `
                      <div class="admin-list-item${_selectedId === p.id ? ' active' : ''}"
                           onclick="AdminVerificationView.select('${p.id}')">
                        <div class="item-name">
                          ${p.name} ${p.title || ''}
                          ${isPending  ? `<span class="badge badge-warning" style="margin-left:4px;font-size:10px;padding:1px 5px">대기</span>` : ''}
                          ${isRejected ? `<span class="badge badge-danger"  style="margin-left:4px;font-size:10px;padding:1px 5px">반려</span>` : ''}
                          ${p.verifiedAt && !isRejected ? `<span class="badge badge-success" style="margin-left:4px;font-size:10px;padding:1px 5px">승인</span>` : ''}
                        </div>
                        <div class="item-sub">${p.university || '-'}</div>
                        <div class="item-sub">${p.registeredAt || '-'}</div>
                      </div>`;
                  }).join('')}
            </div>
            <div class="admin-list-count">${filtered.length}명</div>
          </div>

          <div class="admin-detail-panel">
            ${selected ? _renderDetail(selected) : `
              <div class="admin-empty-detail">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">교강사를 선택하세요</div>
                <div class="empty-desc">왼쪽 목록에서 검토할 회원을 선택합니다.</div>
              </div>`}
          </div>
        </div>
      </div>`;
  }

  function _renderDetail(p) {
    const docs       = p.verificationDocs || {};
    const isPending  = !p.verifiedAt && p.verificationStatus !== 'rejected';
    const isRejected = p.verificationStatus === 'rejected';

    return `
      <div class="card">
        <div class="card-body">
          <div class="profile-card" style="margin-bottom:20px">
            <div class="avatar" style="width:60px;height:60px;font-size:24px;flex-shrink:0">${p.name[0]}</div>
            <div class="profile-info" style="flex:1">
              <div class="name">${p.name} ${p.title || ''}</div>
              <div class="sub">${p.university || '-'} · ${p.department || '-'}</div>
              <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
                ${isPending  ? `<span class="badge badge-warning">검증 대기</span>` : ''}
                ${isRejected ? `<span class="badge badge-danger">반려됨</span>` : ''}
                ${p.verifiedAt && !isRejected ? `<span class="badge badge-success">인증완료 ${p.verifiedAt}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="grid-2" style="margin-bottom:16px">
            <div>
              <div class="info-row"><span class="label">이메일</span><span class="value">${p.email || '-'}</span></div>
              <div class="info-row"><span class="label">연락처</span><span class="value">${p.phone || '-'}</span></div>
              <div class="info-row"><span class="label">신청일</span><span class="value">${p.registeredAt || '-'}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="label">담당 강의</span><span class="value">${(p.courses || []).join(', ') || '-'}</span></div>
              <div class="info-row"><span class="label">수강생 수</span><span class="value">${p.students || 0}명</span></div>
            </div>
          </div>

          <div class="divider" style="margin:12px 0"></div>
          <div style="font-weight:600;font-size:13px;margin-bottom:12px">제출 서류 확인</div>
          <div style="display:flex;gap:24px;margin-bottom:16px">
            <div style="text-align:center">
              <div style="font-size:22px">${docs.employment ? '✅' : '❌'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">재직증명서</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:22px">${docs.courseplan ? '✅' : '❌'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">강의계획서</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:22px">${docs.id ? '✅' : '❌'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">신분증</div>
            </div>
          </div>

          ${p.note ? `
            <div class="alert alert-info" style="margin-bottom:16px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>${p.note}</div>
            </div>` : ''}

          ${isRejected ? `
            <div class="alert alert-danger" style="margin-bottom:16px">
              <div style="font-weight:600;margin-bottom:4px;font-size:13px">반려 사유</div>
              <div style="font-size:13px">${p.rejectReason || '-'}</div>
            </div>` : ''}

          ${isPending ? `
            <div style="display:flex;gap:10px;margin-top:16px">
              <button class="btn btn-success" onclick="AdminVerificationView.approve('${p.id}')">
                ✓ 승인
              </button>
              <button class="btn btn-outline btn-danger-outline" style="border-color:var(--danger);color:var(--danger)"
                onclick="AdminVerificationView.showRejectModal('${p.id}')">
                반려
              </button>
            </div>` : ''}

          ${p.verifiedAt && !isRejected ? `
            <div style="margin-top:16px">
              <button class="btn btn-outline btn-sm"
                onclick="location.hash='#/admin/professors?id=${p.id}'">
                교강사 상세 조회 →
              </button>
            </div>` : ''}
        </div>
      </div>`;
  }

  function select(profId) {
    _selectedId = profId;
    Router.refresh();
  }

  function approve(profId) {
    const prof = Store.findById('users', profId);
    if (!prof) return;
    Modal.confirm({
      title: '회원 승인',
      message: `${prof.name} 교수님을 신규(New) 등급으로 승인하고 담당 영업자(최영업)를 배정합니다.`,
      confirmText: '승인',
      onConfirm: () => {
        const today = new Date().toISOString().slice(0, 10);
        prof.verifiedAt  = today;
        prof.grade       = 'New';
        prof.assignedTo  = 'sales_01';
        Store.upsert('users', prof);
        Store.upsert('grade_history', {
          id: 'GH_' + Date.now(),
          professorId: profId,
          fromGrade: null,
          toGrade: 'New',
          type: 'auto',
          reasonCategory: '초기등록',
          reason: '회원 인증 완료 — 신규(New) 등급 자동 부여',
          adjustedBy: Auth.current().id,
          adjustedAt: today,
        });
        Toast.success(`${prof.name} 교수님의 회원 인증이 완료되었습니다.`);
        Router.refresh();
      },
    });
  }

  function showRejectModal(profId) {
    const p = Store.findById('users', profId);
    if (!p) return;
    Modal.open({
      title: '회원 반려',
      body: `
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">
          반려 처리 후 해당 교강사에게 사유가 안내됩니다.
        </p>
        <div class="form-group">
          <label class="form-label">반려 사유 <span class="required">*</span></label>
          <textarea id="reject-reason" class="form-control" rows="3"
            placeholder="반려 사유를 상세히 입력하세요 (필수)"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
        <button class="btn btn-danger" onclick="AdminVerificationView.doReject('${profId}')">반려 처리</button>`,
    });
  }

  function doReject(profId) {
    const reason = (document.getElementById('reject-reason') || {}).value || '';
    if (!reason.trim()) {
      Toast.warning('반려 사유를 입력해주세요.');
      return;
    }
    const p = Store.findById('users', profId);
    if (!p) return;
    p.verificationStatus = 'rejected';
    p.rejectReason = reason.trim();
    Store.upsert('users', p);
    Modal.close();
    Toast.info(`${p.name} 교수님의 회원 신청이 반려되었습니다.`);
    Router.refresh();
  }

  function attach() {
    const searchEl = document.getElementById('verif-search');
    if (searchEl) {
      searchEl.oninput = e => { _query = e.target.value; Router.refresh(); };
    }
  }

  return { render, attach, select, approve, showRejectModal, doReject };
})();
