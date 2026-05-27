// views/sample-request.js
const SampleRequestView = (() => {

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
    const books   = Store.getList('books');
    const requests = Store.getList('sample_requests').filter(r => r.professorId === user.id);

    // URL 파라미터로 도서 및 유형 사전 선택
    const preBook = Router.getParam('book') || '';
    const preType = Router.getParam('type') || 'paper';

    // 현재 선택 도서 기준 한도 미리 계산
    const paperCheck = Quota.checkQuota(user.id, 'paper', preBook);
    const ebookCheck = Quota.checkQuota(user.id, 'ebook', preBook);

    const paperRemain = limits.paper === Infinity ? '무제한' :
      Math.max(0, limits.paper - usage.paper) + '종 남음';
    const ebookRemain = limits.ebook === Infinity ? '무제한' :
      Math.max(0, limits.ebook - usage.ebook) + '종 남음';

    // 한도 경고 배너
    let quotaAlert = '';
    if (preType === 'paper' && !paperCheck.allowed) {
      quotaAlert = `
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            ${paperCheck.reason}
            ${paperCheck.suggestEbook && ebookCheck.allowed
              ? `<br><a href="#" onclick="document.getElementById('req-type').value='ebook';
                  document.getElementById('address-group').style.display='none';
                  document.getElementById('quota-warning').style.display='none';
                  return false"
                  style="color:var(--primary);font-weight:600">→ 전자책으로 전환하기</a>`
              : ''}
          </div>
        </div>`;
    } else if (preType === 'ebook' && !ebookCheck.allowed) {
      quotaAlert = `
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>${ebookCheck.reason}</div>
        </div>`;
    }

    return `
      <div>
        <div class="page-header">
          <div class="page-title">견본 도서 신청</div>
          <div class="page-desc">종이책·전자책 견본을 신청하면 담당 영업자가 검토 후 발송합니다.</div>
        </div>

        <div class="alert alert-info" style="margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>${SEM} 신청 현황</strong> —
            종이책 <strong>${usage.paper}종</strong> 사용 (${paperRemain}) ·
            전자책 <strong>${usage.ebook}종</strong> 사용 (${ebookRemain})
          </div>
        </div>

        <div class="grid-2">
          <!-- 신청 폼 -->
          <div class="card">
            <div class="card-header"><span class="card-title">신규 신청</span></div>
            <div class="card-body">
              <div id="quota-warning">${quotaAlert}</div>

              <div class="form-group">
                <label class="form-label">도서 선택 <span class="required">*</span></label>
                <select id="req-book" class="form-control form-select">
                  <option value="">-- 도서를 선택하세요 --</option>
                  ${books.map(b =>
                    `<option value="${b.id}" ${b.id===preBook?'selected':''}>${b.title}</option>`
                  ).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">신청 유형 <span class="required">*</span></label>
                <div style="display:flex;gap:12px;margin-top:4px" id="type-radio-group">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;
                    padding:10px 16px;border:2px solid var(--border);border-radius:6px;flex:1;
                    transition:border-color 0.15s" id="label-paper">
                    <input type="radio" name="req-type" value="paper"
                      ${preType==='paper'?'checked':''} style="accent-color:var(--primary)">
                    <span>
                      <strong style="display:block;font-size:13px">종이책 견본</strong>
                      <span class="fs-xs text-muted">${
                        limits.paper === Infinity ? '제한 없음' :
                        `학기당 ${limits.paper}종 / 잔여 ${Math.max(0,limits.paper-usage.paper)}종`
                      }</span>
                    </span>
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;
                    padding:10px 16px;border:2px solid var(--border);border-radius:6px;flex:1;
                    transition:border-color 0.15s" id="label-ebook">
                    <input type="radio" name="req-type" value="ebook"
                      ${preType==='ebook'?'checked':''} style="accent-color:var(--primary)">
                    <span>
                      <strong style="display:block;font-size:13px">전자책 견본</strong>
                      <span class="fs-xs text-muted">${
                        limits.ebook === Infinity ? '제한 없음' :
                        `학기당 ${limits.ebook}종 / 잔여 ${Math.max(0,limits.ebook-usage.ebook)}종`
                      }</span>
                    </span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">강의 학기 <span class="required">*</span></label>
                <select id="req-semester" class="form-control form-select">
                  <option value="2026-1" selected>2026년 1학기</option>
                  <option value="2026-2">2026년 2학기</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">과목명 <span class="required">*</span></label>
                <input id="req-course" class="form-control" type="text" placeholder="예: 머신러닝 기초">
              </div>

              <div class="form-group">
                <label class="form-label">예상 수강인원 <span class="required">*</span></label>
                <input id="req-students" class="form-control" type="number" min="1" max="9999"
                  placeholder="예: 50">
              </div>

              <div id="address-group" class="form-group"
                style="display:${preType==='paper'?'':'none'}">
                <label class="form-label">배송 주소 <span class="required">*</span></label>
                <input id="req-address" class="form-control" type="text"
                  placeholder="종이책 배송지를 입력하세요">
                <div class="form-hint">연구실·사무실 주소를 입력하세요.</div>
              </div>

              <div class="form-group">
                <label class="form-label">메모</label>
                <textarea id="req-memo" class="form-control"
                  placeholder="담당자에게 전달할 내용 (선택)"></textarea>
              </div>

              <div id="submit-blocker" style="display:none">
                <div class="alert alert-danger">
                  한도 초과로 신청할 수 없습니다. 유형을 변경하거나 다음 학기에 신청하세요.
                </div>
              </div>

              <button class="btn btn-primary btn-full" id="req-submit-btn">
                견본 신청하기 — 담당 영업자 검토 후 발송
              </button>
            </div>
          </div>

          <!-- 신청 내역 -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">신청 내역</span>
              <button class="btn btn-ghost btn-sm"
                onclick="location.hash='#/professor/history'">전체보기</button>
            </div>
            <div class="card-body" style="padding:0;max-height:520px;overflow-y:auto">
              ${requests.length === 0
                ? '<div class="empty-state" style="padding:40px"><div class="empty-desc">신청 내역이 없습니다.</div></div>'
                : `<table class="data-table">
                    <thead><tr><th>도서</th><th>유형</th><th>학기</th><th>상태</th><th>신청일</th></tr></thead>
                    <tbody>
                      ${[...requests].reverse().map(r => {
                        const b = books.find(bk => bk.id === r.bookId);
                        return `<tr>
                          <td style="max-width:130px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500">
                              ${b ? b.title : r.bookId}
                            </div>
                            <div class="fs-xs text-muted">${r.courseName||''}</div>
                          </td>
                          <td>${r.type==='paper'
                            ? '<span class="badge badge-primary">종이책</span>'
                            : '<span class="badge badge-info">전자책</span>'}</td>
                          <td class="fs-sm">${r.semester}</td>
                          <td>${statusBadge(r.status)}</td>
                          <td class="fs-sm text-muted">${r.requestedAt}</td>
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>`}
            </div>
          </div>
        </div>
      </div>`;
  }

  function attach() {
    const typeRadios   = document.querySelectorAll('input[name="req-type"]');
    const addrGroup    = document.getElementById('address-group');
    const submitBtn    = document.getElementById('req-submit-btn');
    const submitBlocker= document.getElementById('submit-blocker');
    const quotaWarn    = document.getElementById('quota-warning');
    const labelPaper   = document.getElementById('label-paper');
    const labelEbook   = document.getElementById('label-ebook');
    if (!typeRadios.length) return;

    // 라디오 버튼 스타일 업데이트 + 주소 토글
    function updateTypeUI() {
      const val = document.querySelector('input[name="req-type"]:checked')?.value;
      if (addrGroup) addrGroup.style.display = val === 'paper' ? '' : 'none';
      if (labelPaper) labelPaper.style.borderColor = val === 'paper' ? 'var(--primary)' : 'var(--border)';
      if (labelEbook) labelEbook.style.borderColor = val === 'ebook' ? 'var(--primary)' : 'var(--border)';
      validateQuota();
    }

    function validateQuota() {
      const user = Auth.current();
      if (!user) return;
      const type   = document.querySelector('input[name="req-type"]:checked')?.value || 'paper';
      const bookId = document.getElementById('req-book')?.value || '';
      const check  = Quota.checkQuota(user.id, type, bookId);

      if (!check.allowed) {
        let html = `<div class="alert alert-warning" style="margin-bottom:12px">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>${check.reason}</div></div>`;
        if (quotaWarn) quotaWarn.innerHTML = html;
        if (submitBtn)    submitBtn.disabled = true;
        if (submitBlocker) submitBlocker.style.display = '';
      } else {
        if (quotaWarn)     quotaWarn.innerHTML = '';
        if (submitBtn)     submitBtn.disabled = false;
        if (submitBlocker) submitBlocker.style.display = 'none';
      }
    }

    typeRadios.forEach(r => r.addEventListener('change', updateTypeUI));
    document.getElementById('req-book')?.addEventListener('change', validateQuota);

    // 초기 스타일
    updateTypeUI();

    if (submitBtn) {
      submitBtn.onclick = () => {
        const user     = Auth.current();
        const bookId   = document.getElementById('req-book').value;
        const type     = document.querySelector('input[name="req-type"]:checked')?.value || 'paper';
        const semester = document.getElementById('req-semester').value;
        const course   = document.getElementById('req-course').value.trim();
        const students = parseInt(document.getElementById('req-students').value);
        const address  = type === 'paper' ? document.getElementById('req-address').value.trim() : '';
        const memo     = document.getElementById('req-memo').value.trim();

        if (!bookId)           { Toast.warning('도서를 선택해주세요.'); return; }
        if (!course)           { Toast.warning('과목명을 입력해주세요.'); return; }
        if (!students || students < 1) { Toast.warning('예상 수강인원을 입력해주세요.'); return; }
        if (type === 'paper' && !address) { Toast.warning('배송 주소를 입력해주세요.'); return; }

        const check = Quota.checkQuota(user.id, type, bookId);
        if (!check.allowed) { Toast.error(check.reason); return; }

        // 중복 신청 확인
        const dup = Store.getList('sample_requests').find(r =>
          r.professorId === user.id && r.bookId === bookId &&
          r.semester === semester && r.type === type && r.status !== 'rejected'
        );
        if (dup) { Toast.warning('동일 도서·학기·유형의 신청이 이미 존재합니다.'); return; }

        Store.upsert('sample_requests', {
          id: 'SR' + Date.now(),
          professorId: user.id,
          bookId, type, status: 'pending',
          requestedAt: new Date().toISOString().slice(0,10),
          processedAt: null,
          semester, courseName: course, expectedStudents: students,
          address, memo, assignedTo: 'sales_01',
        });

        Toast.success('견본 신청이 완료되었습니다. 담당 영업자 검토 후 발송됩니다.');
        setTimeout(() => { location.hash = '#/professor/history'; }, 1200);
      };
    }
  }

  return { render, attach };
})();
