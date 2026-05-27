// views/lecture-material.js
const LectureMaterialView = (() => {

  // 자료 유형 정의
  const MAT_TYPES = [
    { key:'slide',  label:'강의교안 (PPT)', ext:'pptx', icon:'📊' },
    { key:'answer', label:'연습문제 해답',   ext:'pdf',  icon:'📝' },
    { key:'source', label:'예제 소스코드',   ext:'zip',  icon:'💾' },
  ];

  function statusBadge(s) {
    const m = {
      pending:  '<span class="badge badge-warning">검토 대기</span>',
      approved: '<span class="badge badge-success">승인</span>',
      rejected: '<span class="badge badge-danger">반려</span>',
    };
    return m[s] || s;
  }

  function render() {
    const user = Auth.requireRole('professor');
    if (!user) return '';

    const SEM     = Quota.CURRENT_SEMESTER;
    const usage   = Quota.getCurrentUsage(user.id, SEM);
    const limits  = Quota.QUOTA[user.grade] || Quota.QUOTA.New;
    const matUsed = usage.material.size;
    const matLimit= limits.material;

    // hasLectureMaterial=true 인 도서만 표시
    const allBooks  = Store.getList('books').filter(b => b.hasLectureMaterial);
    const matReqs   = Store.getList('material_requests').filter(r => r.professorId === user.id);

    // URL 파라미터로 특정 도서 사전 선택
    const preBook   = Router.getParam('book') || '';

    // 비활성 등급 차단
    if (user.grade === 'Inactive') {
      return `<div class="page-header"><div class="page-title">강의자료 다운로드</div></div>
        <div class="alert alert-danger">
          비활성 등급은 강의자료 다운로드가 제한됩니다. 담당 영업자에게 문의하세요.
        </div>`;
    }

    const matRemain = matLimit === Infinity ? '무제한' :
      Math.max(0, matLimit - matUsed) + '종 남음';

    return `
      <div>
        <div class="page-header">
          <div class="page-title">강의자료 다운로드</div>
          <div class="page-desc">강의교안(PPT)·연습문제 해답·예제 소스코드를 다운로드합니다.</div>
        </div>

        <div class="alert alert-info" style="margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            강의자료 다운로드: <strong>${matUsed}종</strong> 사용 (${matRemain}) ·
            같은 도서는 재다운로드해도 한도가 차감되지 않습니다.
          </div>
        </div>

        ${user.grade === 'C' ? `
        <div class="alert alert-warning" style="margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>C등급은 강의자료 다운로드 시 강의계획서 파일명을 입력해야 합니다.</div>
        </div>` : ''}

        <!-- 도서 목록 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;margin-bottom:24px">
          ${allBooks.map(b => bookMaterialCard(b, matReqs, usage, user, preBook)).join('')}
        </div>

        <!-- 다운로드 이력 -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">다운로드 이력</span>
            <button class="btn btn-ghost btn-sm"
              onclick="location.hash='#/professor/history?tab=material'">전체보기</button>
          </div>
          <div class="card-body" style="padding:0;max-height:320px;overflow-y:auto">
            ${matReqs.length === 0
              ? '<div class="empty-state" style="padding:30px"><div class="empty-desc">다운로드 이력이 없습니다.</div></div>'
              : `<table class="data-table">
                  <thead><tr><th>도서</th><th>상태</th><th>신청일</th><th>다운로드일</th></tr></thead>
                  <tbody>
                    ${[...matReqs].reverse().map(r => {
                      const b = Store.findById('books', r.bookId);
                      return `<tr>
                        <td style="max-width:180px">
                          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                            font-size:12px;font-weight:500">${b?b.title:r.bookId}</div>
                        </td>
                        <td>${statusBadge(r.status)}</td>
                        <td class="fs-sm text-muted">${r.requestedAt}</td>
                        <td class="fs-sm text-muted">${r.downloadedAt||'-'}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>`}
          </div>
        </div>
      </div>`;
  }

  function bookMaterialCard(b, matReqs, usage, user, preBook) {
    const highlight = b.id === preBook ? 'border-color:var(--primary);box-shadow:0 0 0 2px rgba(31,78,121,0.15)' : '';
    const alreadyDL = usage.material.has(b.id);
    const existReq  = matReqs.find(r => r.bookId === b.id && r.status !== 'rejected');
    const approved  = existReq && existReq.status === 'approved';

    const check = Quota.checkQuota(user.id, 'material', b.id);

    let actionHtml = '';
    if (!check.allowed && !check.alreadyDownloaded) {
      actionHtml = `<div class="fs-xs text-muted" style="color:var(--danger)">
        한도 초과 — ${check.reason}</div>`;
    } else if (existReq && existReq.status === 'pending') {
      actionHtml = `<div class="badge badge-warning">담당자 검토 대기 중</div>`;
    } else if (approved || alreadyDL) {
      // 승인된 경우: 자료 유형별 다운로드 버튼
      actionHtml = `<div style="display:flex;flex-wrap:wrap;gap:6px">
        ${MAT_TYPES.map(mt => `
          <button class="btn btn-outline btn-sm"
            onclick="LectureMaterialView.download('${b.id}','${mt.key}','${b.title}','${mt.ext}')">
            ${mt.icon} ${mt.label}
          </button>`).join('')}
      </div>`;
    } else {
      // 미신청 상태 — 신청 버튼
      actionHtml = `
        ${user.grade === 'C' ? `
        <div class="form-group" style="margin-bottom:8px">
          <input class="form-control" type="text" id="plan-file-${b.id}"
            placeholder="강의계획서 파일명 입력 (예: 강의계획서.pdf)" style="font-size:12px">
        </div>` : ''}
        <button class="btn btn-primary btn-sm"
          onclick="LectureMaterialView.requestDownload('${b.id}')">
          강의자료 신청
        </button>`;
    }

    return `
      <div class="card" style="${highlight}">
        <div class="card-body" style="display:flex;gap:14px">
          <div style="width:52px;height:68px;flex-shrink:0;border-radius:4px;
            background:linear-gradient(135deg,${b.coverColor},#999);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:18px">📚</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;margin-bottom:2px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.title}</div>
            <div class="fs-xs text-muted" style="margin-bottom:8px">
              ${b.authors.join(', ')} ·
              ${alreadyDL || approved
                ? '<span style="color:var(--success);font-weight:600">다운로드 완료</span>'
                : existReq ? '<span style="color:var(--warning)">검토 대기</span>'
                : '<span style="color:var(--text-muted)">미신청</span>'}
            </div>
            ${actionHtml}
          </div>
        </div>
      </div>`;
  }

  /**
   * 강의자료 신청 처리
   */
  function requestDownload(bookId) {
    const user = Auth.current();
    const check = Quota.checkQuota(user.id, 'material', bookId);

    if (!check.allowed && !check.alreadyDownloaded) {
      Toast.error(check.reason);
      return;
    }

    if (check.alreadyDownloaded) {
      // 이미 신청/다운로드 이력이 있으면 바로 다운로드 허용
      triggerBlobDownload(bookId);
      return;
    }

    // C등급: 강의계획서 파일명 검증
    if (check.requiresCoursePlan) {
      const planInput = document.getElementById('plan-file-' + bookId);
      const planFile  = planInput ? planInput.value.trim() : '';
      if (!planFile) {
        Toast.warning('C등급은 강의계획서 파일명을 입력해야 합니다.');
        if (planInput) planInput.focus();
        return;
      }
      saveRequest(bookId, planFile);
    } else {
      saveRequest(bookId, null);
    }
  }

  function saveRequest(bookId, coursePlanFile) {
    const user = Auth.current();
    const book = Store.findById('books', bookId);
    Store.upsert('material_requests', {
      id: 'MR' + Date.now(),
      professorId: user.id,
      bookId, status: 'pending',
      requestedAt: new Date().toISOString().slice(0,10),
      processedAt: null, downloadedAt: null,
      coursePlanFile, memo: '',
    });
    Toast.success(`${book ? book.title : bookId} 강의자료 신청이 완료되었습니다. 담당자 검토 후 이용 가능합니다.`);
    Router.refresh();
  }

  /**
   * Blob으로 모의 파일 다운로드
   */
  function download(bookId, matType, bookTitle, ext) {
    const user  = Auth.current();
    const mt    = MAT_TYPES.find(m => m.key === matType);
    const label = mt ? mt.label : matType;
    const fname = `Mock-${label}-${bookTitle.replace(/[\s\/\\:*?"<>|]/g,'_').slice(0,30)}.${ext}`;

    const content = [
      `[한빛아카데미 모의 강의자료]`,
      ``,
      `도서: ${bookTitle}`,
      `자료: ${label}`,
      `다운로드 일시: ${new Date().toLocaleString('ko-KR')}`,
      `요청자: ${user ? user.name : '-'}`,
      ``,
      `※ 이 파일은 프로토타입 시뮬레이션용 더미 파일입니다.`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 다운로드 일자 기록
    const matReqs = Store.getList('material_requests');
    const req = matReqs.find(r =>
      r.professorId === user.id && r.bookId === bookId && r.status !== 'rejected'
    );
    if (req) {
      req.downloadedAt = new Date().toISOString().slice(0,10);
      Store.upsert('material_requests', req);
    }

    Toast.success(`"${fname}" 다운로드가 시작되었습니다.`);
  }

  function triggerBlobDownload(bookId) {
    const b = Store.findById('books', bookId);
    const title = b ? b.title : bookId;
    // 기본으로 슬라이드 다운로드
    download(bookId, 'slide', title, 'pptx');
  }

  function attach() {}

  return { render, attach, requestDownload, download };
})();
