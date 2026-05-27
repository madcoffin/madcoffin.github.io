// views/history.js — 내 신청·다운로드 내역 (탭 3종)
const HistoryView = (() => {

  // URL 파라미터로 탭 초기값 지정 가능: ?tab=sample|material|adoption
  function activeTab() {
    return Router.getParam('tab') || 'sample';
  }

  function statusBadge(s) {
    const m = {
      pending:  '<span class="badge badge-warning">검토 대기</span>',
      approved: '<span class="badge badge-success">승인</span>',
      rejected: '<span class="badge badge-danger">반려</span>',
      confirmed:'<span class="badge badge-success">확정</span>',
    };
    return m[s] || `<span class="badge badge-muted">${s}</span>`;
  }

  function render() {
    const user = Auth.requireRole('professor');
    if (!user) return '';

    const tab = activeTab();

    const samples   = [...Store.getList('sample_requests').filter(r => r.professorId === user.id)].reverse();
    const matReqs   = [...Store.getList('material_requests').filter(r => r.professorId === user.id)].reverse();
    const adoptions = [...Store.getList('adoptions').filter(a => a.professorId === user.id)].reverse();
    const books     = Store.getList('books');

    const tabs = [
      { key:'sample',   label:'견본 도서 신청',      cnt: samples.length   },
      { key:'material', label:'강의자료 다운로드',    cnt: matReqs.length   },
      { key:'adoption', label:'채택 자기신고',        cnt: adoptions.length },
    ];

    return `
      <div>
        <div class="page-header">
          <div class="page-title">내 신청·다운로드 내역</div>
          <div class="page-desc">견본 신청, 강의자료, 채택 신고 이력을 확인합니다.</div>
        </div>

        <div class="tabs">
          ${tabs.map(t => `
            <button class="tab-btn${tab===t.key?' active':''}" data-tab="${t.key}">
              ${t.label}
              <span class="badge ${tab===t.key?'badge-primary':'badge-muted'}"
                style="margin-left:4px">${t.cnt}</span>
            </button>`).join('')}
        </div>

        <!-- 탭: 견본 신청 -->
        <div class="tab-panel${tab==='sample'?' active':''}" id="panel-sample">
          ${samples.length === 0
            ? emptyState('견본 도서 신청 이력이 없습니다.', '도서 카탈로그에서 원하는 도서를 선택해 신청하세요.', '#/professor/books', '도서 둘러보기')
            : `<div class="card">
                <div class="card-header">
                  <span class="card-title">견본 도서 신청 내역 (${samples.length}건)</span>
                  <button class="btn btn-primary btn-sm"
                    onclick="location.hash='#/professor/sample'">+ 신규 신청</button>
                </div>
                <div class="card-body" style="padding:0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>신청일</th><th>도서</th><th>과목</th>
                        <th>유형</th><th>학기</th><th>수강생</th>
                        <th>상태</th><th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${samples.map(r => {
                        const b = books.find(bk => bk.id === r.bookId);
                        return `<tr>
                          <td class="fs-sm text-muted">${r.requestedAt}</td>
                          <td style="max-width:150px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                              font-size:12px;font-weight:600">${b?b.title:r.bookId}</div>
                            ${b?`<div class="fs-xs text-muted">${b.category}</div>`:''}
                          </td>
                          <td class="fs-sm">${r.courseName||'-'}</td>
                          <td>${r.type==='paper'
                            ?'<span class="badge badge-primary">종이책</span>'
                            :'<span class="badge badge-info">전자책</span>'}</td>
                          <td class="fs-sm">${r.semester}</td>
                          <td class="text-center fs-sm">${r.expectedStudents||'-'}</td>
                          <td>${statusBadge(r.status)}</td>
                          <td class="fs-xs text-muted">
                            ${r.status==='approved' && r.processedAt
                              ? '발송: '+r.processedAt
                              : r.status==='rejected'
                              ? r.rejectReason||'반려됨'
                              : '담당자 검토 대기'}
                          </td>
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>`}
        </div>

        <!-- 탭: 강의자료 다운로드 -->
        <div class="tab-panel${tab==='material'?' active':''}" id="panel-material">
          ${matReqs.length === 0
            ? emptyState('강의자료 다운로드 이력이 없습니다.', '강의자료 탭에서 원하는 도서의 자료를 신청하세요.', '#/professor/materials', '강의자료 보기')
            : `<div class="card">
                <div class="card-header">
                  <span class="card-title">강의자료 다운로드 내역 (${matReqs.length}건)</span>
                  <button class="btn btn-outline btn-sm"
                    onclick="location.hash='#/professor/materials'">자료 다운로드</button>
                </div>
                <div class="card-body" style="padding:0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>신청일</th><th>도서</th><th>상태</th>
                        <th>다운로드일</th><th>강의계획서</th><th>재다운로드</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${matReqs.map(r => {
                        const b = books.find(bk => bk.id === r.bookId);
                        return `<tr>
                          <td class="fs-sm text-muted">${r.requestedAt}</td>
                          <td style="max-width:180px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                              font-size:12px;font-weight:600">${b?b.title:r.bookId}</div>
                            ${b?`<div class="fs-xs text-muted">${b.category}</div>`:''}
                          </td>
                          <td>${statusBadge(r.status)}</td>
                          <td class="fs-sm text-muted">${r.downloadedAt||'-'}</td>
                          <td class="fs-xs text-muted">${r.coursePlanFile||'-'}</td>
                          <td>
                            ${r.status==='approved'
                              ? `<button class="btn btn-success btn-sm"
                                  onclick="LectureMaterialView.download('${r.bookId}','slide','${b?b.title.replace(/'/g,"\\'"):r.bookId}','pptx')">
                                  재다운로드
                                </button>`
                              : '-'}
                          </td>
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>`}
        </div>

        <!-- 탭: 채택 신고 -->
        <div class="tab-panel${tab==='adoption'?' active':''}" id="panel-adoption">
          ${adoptions.length === 0
            ? emptyState('채택 자기신고 이력이 없습니다.', '채택 신고 메뉴에서 이번 학기 채택 도서를 신고해주세요.', '#/professor/adoption', '채택 신고하기')
            : `<div class="card">
                <div class="card-header">
                  <span class="card-title">채택 자기신고 내역 (${adoptions.length}건)</span>
                  <button class="btn btn-primary btn-sm"
                    onclick="location.hash='#/professor/adoption'">+ 신규 신고</button>
                </div>
                <div class="card-body" style="padding:0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>신고일</th><th>도서</th><th>학기</th><th>과목</th>
                        <th>분반</th><th>수강생</th><th>강의계획서</th><th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${adoptions.map(a => {
                        const b = books.find(bk => bk.id === a.bookId);
                        return `<tr>
                          <td class="fs-sm text-muted">${a.reportedAt}</td>
                          <td style="max-width:150px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                              font-size:12px;font-weight:600">${b?b.title:a.bookId}</div>
                          </td>
                          <td class="fs-sm">${a.semester}</td>
                          <td class="fs-sm">${a.courseName}</td>
                          <td class="text-center fs-sm">${a.sections||1}</td>
                          <td class="text-center fw-bold">${a.expectedStudents||a.students||0}</td>
                          <td class="fs-xs text-muted" style="max-width:120px">
                            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                              ${a.coursePlanFile||'-'}
                            </div>
                          </td>
                          <td>
                            ${statusBadge(a.status)}
                            ${a.confirmedAt
                              ? `<div class="fs-xs text-muted">확정: ${a.confirmedAt}</div>` : ''}
                          </td>
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>`}
        </div>
      </div>`;
  }

  function emptyState(title, desc, btnHash, btnLabel) {
    return `
      <div class="empty-state" style="padding:60px 20px">
        <div style="font-size:48px;margin-bottom:16px;opacity:0.25">📋</div>
        <div class="empty-title">${title}</div>
        <div class="empty-desc" style="margin-bottom:20px">${desc}</div>
        <button class="btn btn-primary" onclick="location.hash='${btnHash}'">${btnLabel}</button>
      </div>`;
  }

  function attach() {
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.onclick = () => {
        const hash = location.hash.split('?')[0];
        location.hash = hash + '?tab=' + btn.dataset.tab;
      };
    });
  }

  return { render, attach };
})();
