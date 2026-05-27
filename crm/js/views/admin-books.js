// views/admin-books.js
const AdminBooksView = (() => {
  const CATEGORIES = ['데이터/AI','프로그래밍','DB/네트워크','OS/알고리즘','수학/통계','웹/모바일','기타'];

  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const books    = Store.getList('books');
    const matReqs  = Store.getList('material_requests');

    const dlCount = {};
    matReqs.filter(r => r.status === 'approved').forEach(r => {
      dlCount[r.bookId] = (dlCount[r.bookId] || 0) + 1;
    });

    return `
      <div>
        <div class="page-header">
          <div class="page-title">도서 데이터 관리</div>
          <div class="page-desc">등록 도서 목록 관리 및 강의자료 보유 여부를 설정합니다.</div>
        </div>

        <div class="card mb-20">
          <div class="card-header">
            <span class="card-title">등록 도서 (${books.length}종)</span>
          </div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>제목</th>
                  <th>카테고리</th>
                  <th>정가</th>
                  <th>전자책</th>
                  <th>강의자료</th>
                  <th>다운로드</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                ${books.map((b, i) => `
                  <tr>
                    <td class="text-center text-muted fs-sm">${i+1}</td>
                    <td>
                      <div style="font-weight:600;font-size:13px">${b.title}</div>
                      <div class="fs-xs text-muted">${(b.authors||[]).join(', ')}${b.translators&&b.translators.length?` / 역: ${b.translators.join(', ')}`:''}
                      </div>
                    </td>
                    <td><span class="badge badge-muted">${b.category}</span></td>
                    <td class="fs-sm">${(b.price||0).toLocaleString()}원</td>
                    <td class="text-center">
                      <input type="checkbox" ${b.digitalAvailable?'checked':''} title="전자책 가능"
                        onchange="AdminBooksView.toggleField('${b.id}','digitalAvailable',this.checked)">
                    </td>
                    <td class="text-center">
                      <input type="checkbox" ${b.hasLectureMaterial?'checked':''} title="강의자료 보유"
                        onchange="AdminBooksView.toggleField('${b.id}','hasLectureMaterial',this.checked)">
                    </td>
                    <td class="text-center">
                      ${_miniBar(dlCount[b.id]||0, 5)}
                    </td>
                    <td>
                      <button class="btn btn-outline-gray btn-sm"
                        onclick="AdminBooksView.showEdit('${b.id}')">편집</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">신규 도서 추가</span></div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">제목 <span class="required">*</span></label>
                <input id="new-book-title" class="form-control" type="text" placeholder="도서 제목">
              </div>
              <div class="form-group">
                <label class="form-label">저자</label>
                <input id="new-book-authors" class="form-control" type="text" placeholder="저자명 (쉼표 구분)">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">카테고리</label>
                <select id="new-book-category" class="form-control form-select">
                  ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">정가 (원)</label>
                <input id="new-book-price" class="form-control" type="number" placeholder="예: 32000" min="0">
              </div>
            </div>
            <div style="display:flex;gap:20px;margin-bottom:16px">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                <input id="new-book-ebook" type="checkbox"> 전자책 가능
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                <input id="new-book-material" type="checkbox"> 강의자료 보유
              </label>
            </div>
            <button class="btn btn-primary" onclick="AdminBooksView.addBook()">도서 추가</button>
          </div>
        </div>
      </div>`;
  }

  function _miniBar(count, max) {
    const pct = max > 0 ? Math.min(count / max, 1) * 100 : 0;
    return `<div style="display:flex;align-items:center;gap:6px">
      <div style="width:60px;height:6px;background:var(--border-light);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--secondary);border-radius:3px"></div>
      </div>
      <span class="fs-xs text-muted">${count}</span>
    </div>`;
  }

  function toggleField(bookId, field, value) {
    const b = Store.findById('books', bookId);
    if (!b) return;
    b[field] = value;
    Store.upsert('books', b);
    Toast.success('저장되었습니다.');
  }

  function showEdit(bookId) {
    const b = Store.findById('books', bookId);
    if (!b) return;
    Modal.open({
      title: '도서 편집',
      body: `
        <div class="form-group">
          <label class="form-label">제목 <span class="required">*</span></label>
          <input id="edit-book-title" class="form-control" type="text" value="${b.title}">
        </div>
        <div class="form-group">
          <label class="form-label">저자 (쉼표 구분)</label>
          <input id="edit-book-authors" class="form-control" type="text" value="${(b.authors||[]).join(', ')}">
        </div>
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select id="edit-book-category" class="form-control form-select">
            ${CATEGORIES.map(c => `<option value="${c}" ${c===b.category?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">정가 (원)</label>
          <input id="edit-book-price" class="form-control" type="number" value="${b.price||0}">
        </div>
        <div style="display:flex;gap:20px">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input id="edit-book-ebook" type="checkbox" ${b.digitalAvailable?'checked':''}> 전자책 가능
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input id="edit-book-material" type="checkbox" ${b.hasLectureMaterial?'checked':''}> 강의자료 보유
          </label>
        </div>`,
      footer: `
        <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" onclick="AdminBooksView.saveEdit('${bookId}')">저장</button>`,
    });
  }

  function saveEdit(bookId) {
    const title = (document.getElementById('edit-book-title')||{}).value||'';
    if (!title.trim()) { Toast.warning('제목을 입력해주세요.'); return; }
    const b = Store.findById('books', bookId);
    if (!b) return;
    b.title           = title.trim();
    b.authors         = (document.getElementById('edit-book-authors')||{}).value.split(',').map(s=>s.trim()).filter(Boolean);
    b.category        = (document.getElementById('edit-book-category')||{}).value;
    b.price           = parseInt((document.getElementById('edit-book-price')||{}).value)||0;
    b.digitalAvailable   = (document.getElementById('edit-book-ebook')||{}).checked;
    b.hasLectureMaterial = (document.getElementById('edit-book-material')||{}).checked;
    Store.upsert('books', b);
    Modal.close();
    Toast.success('도서 정보가 업데이트되었습니다.');
    Router.refresh();
  }

  function addBook() {
    const title = (document.getElementById('new-book-title')||{}).value||'';
    if (!title.trim()) { Toast.warning('제목을 입력해주세요.'); return; }
    const newBook = {
      id:                  'BK_' + Date.now(),
      title:               title.trim(),
      authors:             (document.getElementById('new-book-authors')||{}).value.split(',').map(s=>s.trim()).filter(Boolean),
      translators:         [],
      category:            (document.getElementById('new-book-category')||{}).value,
      price:               parseInt((document.getElementById('new-book-price')||{}).value)||0,
      coverColor:          '#1F4E79',
      hasLectureMaterial:  (document.getElementById('new-book-material')||{}).checked,
      digitalAvailable:    (document.getElementById('new-book-ebook')||{}).checked,
      description:         '',
    };
    Store.upsert('books', newBook);
    Toast.success(`'${newBook.title}' 도서가 추가되었습니다.`);
    Router.refresh();
  }

  function attach() {}
  return { render, attach, toggleField, showEdit, saveEdit, addBook };
})();
