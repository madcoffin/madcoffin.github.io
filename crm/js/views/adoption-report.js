// views/adoption-report.js
const AdoptionReportView = (() => {

  function render() {
    const user = Auth.requireRole('professor');
    if (!user) return '';

    const adoptions = Store.getList('adoptions').filter(a => a.professorId === user.id);
    const books     = Store.getList('books');

    // 견본 승인 이력이 있는 도서 목록 (채택 선택용)
    const sampledBookIds = Store.getList('sample_requests')
      .filter(r => r.professorId === user.id && r.status === 'approved')
      .map(r => r.bookId)
      .filter((v, i, a) => a.indexOf(v) === i);

    return `
      <div>
        <div class="page-header">
          <div class="page-title">채택 자기신고</div>
          <div class="page-desc">이번 학기 채택 도서를 신고하면 담당자 확인 후 등급 산정에 반영됩니다.</div>
        </div>

        <div class="alert alert-accent" style="margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            채택 등록 기간: <strong>2026년 5월 26일 ~ 6월 30일</strong><br>
            신고 후 담당 영업자 검토 대기 상태로 저장됩니다. 내역은 아래 또는
            <a href="#" onclick="location.hash='#/professor/history?tab=adoption';return false"
              style="color:var(--primary-dark);font-weight:600">내 신청 내역</a>에서 확인할 수 있습니다.
          </div>
        </div>

        <div class="grid-2">
          <!-- 신고 폼 -->
          <div class="card">
            <div class="card-header"><span class="card-title">채택 신고</span></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">도서 선택 <span class="required">*</span></label>
                <select id="adopt-book" class="form-control form-select">
                  <option value="">-- 도서를 선택하세요 --</option>
                  ${books.map(b => {
                    const hasSample = sampledBookIds.includes(b.id);
                    return `<option value="${b.id}">${b.title}${hasSample?' ✓':''}</option>`;
                  }).join('')}
                </select>
                <div class="form-hint">✓ 표시: 견본 승인된 도서</div>
              </div>

              <div class="form-group">
                <label class="form-label">학기 <span class="required">*</span></label>
                <select id="adopt-semester" class="form-control form-select">
                  <option value="2026-1" selected>2026년 1학기</option>
                  <option value="2026-2">2026년 2학기</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">과목명 <span class="required">*</span></label>
                  <input id="adopt-course" class="form-control" type="text" placeholder="예: 데이터베이스">
                </div>
                <div class="form-group">
                  <label class="form-label">분반 수 <span class="required">*</span></label>
                  <input id="adopt-sections" class="form-control" type="number" min="1" max="99"
                    placeholder="예: 2" value="1">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">예상 수강인원 <span class="required">*</span></label>
                <input id="adopt-students" class="form-control" type="number" min="1" max="9999"
                  placeholder="분반 합계 총 인원을 입력하세요">
              </div>

              <div class="form-group">
                <label class="form-label">강의계획서 파일명 <span class="required">*</span></label>
                <input id="adopt-plan" class="form-control" type="text"
                  placeholder="예: 강의계획서_2026-1.pdf">
                <div class="form-hint">실제 파일 업로드 없이 파일명만 입력합니다 (프로토타입).</div>
              </div>

              <button class="btn btn-primary btn-full" id="adopt-submit-btn">
                채택 신고 — 담당 영업자 검토 대기
              </button>
            </div>
          </div>

          <!-- 신고 이력 -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">채택 이력</span>
              <button class="btn btn-ghost btn-sm"
                onclick="location.hash='#/professor/history?tab=adoption'">전체보기</button>
            </div>
            <div class="card-body" style="padding:0;max-height:500px;overflow-y:auto">
              ${adoptions.length === 0
                ? '<div class="empty-state" style="padding:40px"><div class="empty-desc">채택 이력이 없습니다.</div></div>'
                : `<table class="data-table">
                    <thead><tr><th>도서</th><th>학기</th><th>강의</th><th>분반</th><th>학생수</th><th>상태</th></tr></thead>
                    <tbody>
                      ${[...adoptions].reverse().map(a => {
                        const b = books.find(bk => bk.id === a.bookId);
                        return `<tr>
                          <td style="max-width:120px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                              font-size:12px;font-weight:500">${b?b.title:a.bookId}</div>
                          </td>
                          <td class="fs-sm">${a.semester}</td>
                          <td class="fs-sm">${a.courseName}</td>
                          <td class="text-center fs-sm">${a.sections||1}</td>
                          <td class="text-center fw-bold">${a.expectedStudents||a.students||0}</td>
                          <td>${a.status==='confirmed'
                            ? '<span class="badge badge-success">확정</span>'
                            : '<span class="badge badge-warning">검토 대기</span>'}</td>
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
    const btn = document.getElementById('adopt-submit-btn');
    if (!btn) return;

    btn.onclick = () => {
      const user     = Auth.current();
      const bookId   = document.getElementById('adopt-book').value;
      const semester = document.getElementById('adopt-semester').value;
      const course   = document.getElementById('adopt-course').value.trim();
      const sections = parseInt(document.getElementById('adopt-sections').value) || 1;
      const students = parseInt(document.getElementById('adopt-students').value);
      const planFile = document.getElementById('adopt-plan').value.trim();

      if (!bookId)           { Toast.warning('도서를 선택해주세요.'); return; }
      if (!course)           { Toast.warning('과목명을 입력해주세요.'); return; }
      if (!students || students < 1) { Toast.warning('예상 수강인원을 입력해주세요.'); return; }
      if (!planFile)         { Toast.warning('강의계획서 파일명을 입력해주세요.'); return; }

      // 동일 도서·학기 중복 신고 확인
      const dup = Store.getList('adoptions').find(a =>
        a.professorId === user.id && a.bookId === bookId && a.semester === semester
      );
      if (dup) { Toast.warning('동일 도서·학기에 이미 채택 신고가 존재합니다.'); return; }

      Store.upsert('adoptions', {
        id: 'AD' + Date.now(),
        professorId: user.id,
        bookId, semester, courseName: course,
        sections, expectedStudents: students,
        coursePlanFile: planFile,
        reportedAt: new Date().toISOString().slice(0,10),
        status: 'pending', confirmedAt: null,
      });

      Toast.success('채택 신고가 완료되었습니다. 담당자 검토 후 등급에 반영됩니다.');
      setTimeout(() => { location.hash = '#/professor/history?tab=adoption'; }, 1200);
    };
  }

  return { render, attach };
})();
