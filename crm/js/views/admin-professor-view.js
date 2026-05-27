// views/admin-professor-view.js
const AdminProfessorView = (() => {
  let _query       = '';
  let _gradeFilter = 'all';
  let _selectedId  = null;
  let _tab         = 'info';

  const TABS = [
    { id: 'info',      label: '기본정보' },
    { id: 'adoptions', label: '채택이력' },
    { id: 'gifts',     label: '증정이력' },
    { id: 'downloads', label: '다운로드이력' },
    { id: 'contacts',  label: '접촉이력' },
    { id: 'grade',     label: '등급' },
  ];

  const REASON_CATEGORIES = [
    '다수 채택 실적 우수',
    '전략 대학 VIP 관리',
    '수강생 규모 증가',
    '장기 미채택 (강등)',
    '활동 저조 (강등)',
    '영업 관계자 추천',
    '기타',
  ];

  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    if (params.get('id')) _selectedId = params.get('id');

    const allProfs = Store.getList('users').filter(u => u.role === 'professor');
    const filtered = allProfs.filter(p => {
      const qOk = !_query ||
        p.name.includes(_query) ||
        (p.university  || '').includes(_query) ||
        (p.department  || '').includes(_query);
      const gOk = _gradeFilter === 'all' ||
        (_gradeFilter === 'temp' && p.isTemp) ||
        (!p.isTemp && p.grade === _gradeFilter);
      return qOk && gOk;
    });

    const selected = _selectedId ? allProfs.find(p => p.id === _selectedId) : null;

    return `
      <div>
        <div class="page-header">
          <div class="page-title">교강사 조회</div>
          <div class="page-desc">등록 교강사 전체 조회 및 관리 (정식 회원 + 임시 등록)</div>
        </div>
        <div class="admin-split">
          ${_renderListPanel(filtered)}
          <div class="admin-detail-panel">
            ${selected ? _renderDetail(selected) : `
              <div class="admin-empty-detail">
                <div class="empty-icon">👤</div>
                <div class="empty-title">교강사를 선택하세요</div>
                <div class="empty-desc">왼쪽 목록에서 조회할 교강사를 선택합니다.</div>
              </div>`}
          </div>
        </div>
      </div>`;
  }

  function _renderListPanel(filtered) {
    return `
      <div class="admin-list-panel">
        <div class="admin-list-search">
          <input id="prof-search" class="form-control" type="text"
            placeholder="성명·소속 검색..." value="${_query}" style="font-size:13px">
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
            ${['all','S','A','B','C','New','Inactive','temp'].map(g =>
              `<button class="filter-chip${_gradeFilter===g?' active':''}" data-grade="${g}"
                style="padding:2px 8px;font-size:11px">
                ${g==='all'?'전체':g==='temp'?'임시':Quota.GRADE_LABELS[g]||g}
              </button>`
            ).join('')}
          </div>
        </div>
        <div class="admin-list-items">
          ${filtered.length === 0
            ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px">검색 결과 없음</div>`
            : filtered.map(p => `
                <div class="admin-list-item${_selectedId===p.id?' active':''}"
                     onclick="AdminProfessorView.select('${p.id}')">
                  <div class="item-name">
                    ${p.name} ${p.title||''}
                    ${p.isTemp
                      ? `<span style="font-size:10px;background:#f0f0f0;color:#666;border:1px solid #ddd;border-radius:3px;padding:0 4px;margin-left:4px">임시</span>`
                      : ''}
                  </div>
                  <div class="item-sub">${p.university||'-'}</div>
                  <div class="item-sub" style="margin-top:2px">
                    ${p.isTemp
                      ? '<span style="font-size:10px;color:var(--text-muted)">비회원</span>'
                      : `<span class="grade-badge grade-${p.grade}" style="font-size:10px;padding:1px 5px">${Quota.GRADE_LABELS[p.grade]||p.grade}</span>`}
                  </div>
                </div>`
            ).join('')}
        </div>
        <div class="admin-list-count">${filtered.length}명</div>
      </div>`;
  }

  function _renderDetail(p) {
    return `
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-body" style="padding:16px 20px">
            <div style="display:flex;align-items:center;gap:16px">
              <div class="avatar" style="width:56px;height:56px;font-size:22px;flex-shrink:0">${p.name[0]}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:17px;font-weight:700;margin-bottom:3px">
                  ${p.name} ${p.title||''}
                  ${p.isTemp
                    ? `<span style="font-size:11px;background:#f0f0f0;color:#666;border:1px solid #ddd;border-radius:3px;padding:1px 6px;margin-left:6px">임시 ID</span>`
                    : ''}
                </div>
                <div style="font-size:13px;color:var(--text-muted)">${p.university||'-'} · ${p.department||'-'}</div>
                ${!p.isTemp ? `
                  <div style="margin-top:6px;display:flex;align-items:center;gap:8px">
                    <span class="grade-badge grade-${p.grade}">${Quota.GRADE_LABELS[p.grade]||p.grade}</span>
                    <span style="font-size:11px;color:var(--text-muted)">
                      ${p.verifiedAt ? '인증완료 '+p.verifiedAt : '<span style="color:var(--warning)">미인증</span>'}
                    </span>
                  </div>` : ''}
              </div>
              ${!p.isTemp && p.grade
                ? `<button class="btn btn-outline btn-sm" onclick="AdminProfessorView.openGradeModal('${p.id}')">등급 변경</button>`
                : ''}
            </div>
          </div>
        </div>

        <div class="tabs" style="margin-bottom:16px">
          ${TABS.map(t => `
            <button class="tab-btn${_tab===t.id?' active':''}"
                    onclick="AdminProfessorView.setTab('${t.id}')">
              ${t.label}
            </button>`).join('')}
        </div>

        ${_renderTabContent(p)}
      </div>`;
  }

  function _renderTabContent(p) {
    switch (_tab) {
      case 'adoptions': return _tabAdoptions(p);
      case 'gifts':     return _tabGifts(p);
      case 'downloads': return _tabDownloads(p);
      case 'contacts':  return _tabContacts(p);
      case 'grade':     return _tabGrade(p);
      default:          return _tabInfo(p);
    }
  }

  function _tabInfo(p) {
    const salesRep    = p.assignedTo ? Store.findById('users', p.assignedTo) : null;
    const adoptCount  = Store.getList('adoptions').filter(a => a.professorId===p.id && a.status==='confirmed').length;
    const sampleCount = Store.getList('sample_requests').filter(r => r.professorId===p.id && r.status==='approved').length;
    const matCount    = Store.getList('material_requests').filter(r => r.professorId===p.id && r.status==='approved').length;

    return `
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">기본 정보</span></div>
          <div class="card-body">
            <div class="info-row"><span class="label">이메일</span><span class="value">${p.email||'-'}</span></div>
            <div class="info-row"><span class="label">연락처</span><span class="value">${p.phone||'-'}</span></div>
            <div class="info-row"><span class="label">담당 강의</span><span class="value">${(p.courses||[]).join(', ')||'-'}</span></div>
            <div class="info-row"><span class="label">수강생</span><span class="value">${p.students||0}명</span></div>
            ${!p.isTemp ? `
              <div class="info-row"><span class="label">가입일</span><span class="value">${p.registeredAt||'-'}</span></div>
              <div class="info-row"><span class="label">인증일</span><span class="value">${p.verifiedAt||'미인증'}</span></div>` : ''}
            <div class="info-row"><span class="label">담당 영업</span><span class="value">${salesRep ? salesRep.name : (p.assignedTo||'-')}</span></div>
            ${p.note ? `<div class="info-row"><span class="label">메모</span><span class="value fs-sm">${p.note}</span></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">활동 요약</span></div>
          <div class="card-body">
            <div class="info-row"><span class="label">확정 채택</span><span class="value fw-bold text-success">${adoptCount}건</span></div>
            <div class="info-row"><span class="label">승인된 견본</span><span class="value fw-bold">${sampleCount}건</span></div>
            <div class="info-row"><span class="label">강의자료 다운</span><span class="value fw-bold">${matCount}건</span></div>
            ${p.isTemp ? `
              <div class="divider" style="margin:10px 0"></div>
              <div class="info-row"><span class="label">회원 유형</span>
                <span class="value">
                  <span style="font-size:12px;background:#f0f0f0;color:#666;border:1px solid #ddd;border-radius:3px;padding:2px 8px">임시 등록 (비회원)</span>
                </span>
              </div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function _tabAdoptions(p) {
    const adoptions = Store.getList('adoptions').filter(a => a.professorId===p.id);
    const books     = Store.getList('books');
    if (adoptions.length === 0) return `
      <div class="card"><div class="card-body">
        <div class="empty-state" style="padding:30px"><div class="empty-desc">채택 이력이 없습니다.</div></div>
      </div></div>`;
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">채택 이력 (${adoptions.length}건)</span></div>
        <div class="card-body p-0">
          <table class="data-table">
            <thead><tr><th>도서</th><th>학기</th><th>강의명</th><th>학생수</th><th>분반</th><th>강의계획서</th><th>상태</th><th>확정일</th></tr></thead>
            <tbody>
              ${[...adoptions].reverse().map(a => {
                const b = books.find(bk=>bk.id===a.bookId);
                return `<tr>
                  <td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${b?b.title:a.bookId}</div></td>
                  <td class="fs-sm">${a.semester}</td>
                  <td class="fs-sm">${a.courseName||'-'}</td>
                  <td class="text-center fw-bold">${a.students||'-'}</td>
                  <td class="text-center">${a.sections||'-'}</td>
                  <td class="fs-sm">${a.coursePlanFile||'-'}</td>
                  <td>${a.status==='confirmed'?'<span class="badge badge-success">확정</span>':a.status==='pending'?'<span class="badge badge-warning">대기</span>':'<span class="badge badge-danger">반려</span>'}</td>
                  <td class="fs-sm text-muted">${a.confirmedAt||'-'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _tabGifts(p) {
    const samples = Store.getList('sample_requests').filter(r => r.professorId===p.id);
    const books   = Store.getList('books');
    if (samples.length === 0) return `
      <div class="card"><div class="card-body">
        <div class="empty-state" style="padding:30px"><div class="empty-desc">증정 이력이 없습니다.</div></div>
      </div></div>`;
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">견본 증정 이력 (${samples.length}건)</span></div>
        <div class="card-body p-0">
          <table class="data-table">
            <thead><tr><th>도서</th><th>유형</th><th>학기</th><th>강의명</th><th>예상학생</th><th>상태</th><th>신청일</th></tr></thead>
            <tbody>
              ${[...samples].reverse().map(r => {
                const b = books.find(bk=>bk.id===r.bookId);
                return `<tr>
                  <td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${b?b.title:r.bookId}</div></td>
                  <td>${r.type==='paper'?'<span class="badge badge-primary">종이책</span>':'<span class="badge badge-info">전자책</span>'}</td>
                  <td class="fs-sm">${r.semester}</td>
                  <td class="fs-sm">${r.courseName||'-'}</td>
                  <td class="text-center">${r.expectedStudents||'-'}</td>
                  <td>${r.status==='approved'?'<span class="badge badge-success">승인</span>':r.status==='pending'?'<span class="badge badge-warning">검토중</span>':'<span class="badge badge-danger">반려</span>'}</td>
                  <td class="fs-sm text-muted">${r.requestedAt}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _tabDownloads(p) {
    const matReqs = Store.getList('material_requests').filter(r => r.professorId===p.id);
    const books   = Store.getList('books');
    if (matReqs.length === 0) return `
      <div class="card"><div class="card-body">
        <div class="empty-state" style="padding:30px"><div class="empty-desc">다운로드 이력이 없습니다.</div></div>
      </div></div>`;
    const typeLabel = t => ({ slide:'슬라이드(PPT)', answer:'정답·해설(PDF)', source:'소스코드(ZIP)' }[t] || t || '-');
    return `
      <div class="card">
        <div class="card-header"><span class="card-title">강의자료 다운로드 이력 (${matReqs.length}건)</span></div>
        <div class="card-body p-0">
          <table class="data-table">
            <thead><tr><th>도서</th><th>자료 유형</th><th>강의계획서</th><th>상태</th><th>신청일</th></tr></thead>
            <tbody>
              ${[...matReqs].reverse().map(r => {
                const b = books.find(bk=>bk.id===r.bookId);
                return `<tr>
                  <td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${b?b.title:r.bookId}</div></td>
                  <td class="fs-sm">${typeLabel(r.materialType)}</td>
                  <td class="fs-sm">${r.coursePlanFile||'-'}</td>
                  <td>${r.status==='approved'?'<span class="badge badge-success">승인</span>':r.status==='pending'?'<span class="badge badge-warning">검토중</span>':'<span class="badge badge-danger">반려</span>'}</td>
                  <td class="fs-sm text-muted">${r.requestedAt}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function _tabContacts(p) {
    const notes = Store.getList('contact_notes')
      .filter(n => n.professorId===p.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const creatorMap = {};
    Store.getList('users').forEach(u => { creatorMap[u.id] = u.name; });

    return `
      <div class="card">
        <div class="card-header"><span class="card-title">접촉 이력 (${notes.length}건)</span></div>
        <div class="card-body">
          ${notes.length === 0
            ? `<div class="empty-state" style="padding:16px 0"><div class="empty-desc">접촉 이력이 없습니다.</div></div>`
            : notes.map(n => `
                <div class="contact-note-item">
                  <div class="contact-note-meta">${n.createdAt} · ${creatorMap[n.createdBy]||n.createdBy}</div>
                  <div class="contact-note-body">${n.content}</div>
                </div>`).join('')}
          <div class="divider" style="margin:16px 0"></div>
          <div style="font-weight:600;font-size:13px;margin-bottom:8px">메모 추가</div>
          <textarea id="contact-note-input" class="form-control" rows="3"
            placeholder="접촉 내용이나 영업 메모를 입력하세요..." style="margin-bottom:8px"></textarea>
          <button class="btn btn-primary btn-sm"
            onclick="AdminProfessorView.addContactNote('${p.id}')">추가</button>
        </div>
      </div>`;
  }

  function _tabGrade(p) {
    if (p.isTemp || !p.grade) {
      return `
        <div class="card"><div class="card-body">
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>임시 등록 교강사는 포털 회원가입 및 인증 완료 후 등급 관리가 가능합니다.</div>
          </div>
        </div></div>`;
    }

    const history = Store.getList('grade_history')
      .filter(h => h.professorId===p.id)
      .sort((a, b) => a.adjustedAt.localeCompare(b.adjustedAt));

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">등급 이력</span>
          <button class="btn btn-outline btn-sm"
            onclick="AdminProfessorView.openGradeModal('${p.id}')">
            등급 수동 보정
          </button>
        </div>
        <div class="card-body">
          ${history.length === 0
            ? `<div class="empty-state" style="padding:20px 0"><div class="empty-desc">등급 변경 이력이 없습니다.</div></div>`
            : `<div class="grade-timeline">
                ${history.map(h => `
                  <div class="grade-timeline-item${h.type==='manual'?' manual':''}">
                    <div class="grade-timeline-date">${h.adjustedAt}</div>
                    <div class="grade-timeline-title">
                      ${h.fromGrade ? `<span class="grade-badge grade-${h.fromGrade}" style="font-size:11px;padding:1px 6px">${Quota.GRADE_LABELS[h.fromGrade]||h.fromGrade}</span> → ` : ''}
                      <span class="grade-badge grade-${h.toGrade}" style="font-size:11px;padding:1px 6px">${Quota.GRADE_LABELS[h.toGrade]||h.toGrade}</span>
                      ${h.type==='manual'
                        ? `<span style="font-size:11px;color:var(--warning);margin-left:6px;font-weight:600">수동보정</span>`
                        : `<span style="font-size:11px;color:var(--text-muted);margin-left:6px">자동</span>`}
                      ${h.reasonCategory ? `<span style="font-size:11px;color:var(--text-muted);margin-left:4px">[${h.reasonCategory}]</span>` : ''}
                    </div>
                    <div class="grade-timeline-desc">${h.reason||''}</div>
                  </div>`).join('')}
              </div>`}
        </div>
      </div>`;
  }

  function select(profId) {
    _selectedId = profId;
    Router.refresh();
  }

  function setTab(tab) {
    _tab = tab;
    Router.refresh();
  }

  function openGradeModal(profId) {
    const p = Store.findById('users', profId);
    if (!p) return;
    Modal.open({
      title: `${p.name} 등급 수동 보정`,
      body: `
        <div class="form-group">
          <label class="form-label">현재 등급</label>
          <div><span class="grade-badge grade-${p.grade}">${Quota.GRADE_LABELS[p.grade]||p.grade}</span></div>
        </div>
        <div class="form-group">
          <label class="form-label">새 등급 <span class="required">*</span></label>
          <select id="grade-select" class="form-control form-select">
            <option value="">-- 선택하세요 --</option>
            ${['A','B','C'].map(g =>
              `<option value="${g}">${Quota.GRADE_LABELS[g]} — 종이책 ${Quota.QUOTA[g].paper}종/학기</option>`
            ).join('')}
          </select>
          <div class="fs-xs text-muted" style="margin-top:4px">S등급·비활성은 시스템 자동 산정 전용입니다.</div>
        </div>
        <div class="form-group">
          <label class="form-label">변경 사유 카테고리 <span class="required">*</span></label>
          <select id="grade-reason-cat" class="form-control form-select">
            <option value="">-- 선택하세요 --</option>
            ${REASON_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">상세 사유 <span class="required">*</span></label>
          <textarea id="grade-reason-text" class="form-control" rows="3"
            placeholder="등급 변경 사유를 상세히 입력하세요 (필수)"></textarea>
        </div>`,
      footer: `
        <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" onclick="AdminProfessorView.saveGrade('${profId}')">저장</button>`,
    });
  }

  function saveGrade(profId) {
    const gradeEl  = document.getElementById('grade-select');
    const catEl    = document.getElementById('grade-reason-cat');
    const textEl   = document.getElementById('grade-reason-text');
    if (!gradeEl || !catEl || !textEl) return;
    const newGrade = gradeEl.value;
    const category = catEl.value;
    const reason   = textEl.value.trim();
    if (!newGrade)  { Toast.warning('새 등급을 선택해주세요.'); return; }
    if (!category)  { Toast.warning('변경 사유 카테고리를 선택해주세요.'); return; }
    if (!reason)    { Toast.warning('상세 사유를 입력해주세요.'); return; }

    const p = Store.findById('users', profId);
    if (!p) return;
    const fromGrade = p.grade;
    const today     = new Date().toISOString().slice(0, 10);
    p.grade = newGrade;
    Store.upsert('users', p);
    Store.upsert('grade_history', {
      id:             'GH_' + Date.now(),
      professorId:    profId,
      fromGrade,
      toGrade:        newGrade,
      type:           'manual',
      reasonCategory: category,
      reason,
      adjustedBy:     Auth.current().id,
      adjustedAt:     today,
    });
    Modal.close();
    Toast.success(`${p.name}의 등급이 ${Quota.GRADE_LABELS[newGrade]}로 변경되었습니다.`);
    Router.refresh();
  }

  function addContactNote(profId) {
    const textEl = document.getElementById('contact-note-input');
    if (!textEl) return;
    const content = textEl.value.trim();
    if (!content) { Toast.warning('메모 내용을 입력해주세요.'); return; }
    const user = Auth.current();
    Store.upsert('contact_notes', {
      id:          'CN_' + Date.now(),
      professorId: profId,
      content,
      createdBy:   user ? user.id : 'unknown',
      createdAt:   new Date().toISOString().slice(0, 10),
    });
    Toast.success('접촉 이력이 추가되었습니다.');
    Router.refresh();
  }

  function attach() {
    const searchEl = document.getElementById('prof-search');
    if (searchEl) {
      searchEl.oninput = e => { _query = e.target.value; Router.refresh(); };
    }
    document.querySelectorAll('.filter-chip[data-grade]').forEach(chip => {
      chip.onclick = () => { _gradeFilter = chip.dataset.grade; Router.refresh(); };
    });
  }

  return { render, attach, select, setTab, openGradeModal, saveGrade, addContactNote };
})();
