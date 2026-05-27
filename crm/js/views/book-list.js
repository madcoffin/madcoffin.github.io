// views/book-list.js
const BookListView = (() => {
  let _category = 'all';
  let _query    = '';

  const CATEGORIES = ['all','데이터/AI','프로그래밍','DB/네트워크','OS/알고리즘','웹/모바일','수학/통계'];

  function lighten(hex) {
    try {
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.min(255, (n >> 16 & 0xff) + 60);
      const g = Math.min(255, (n >>  8 & 0xff) + 60);
      const b = Math.min(255, (n       & 0xff) + 60);
      return `rgb(${r},${g},${b})`;
    } catch { return '#888'; }
  }

  function coverBg(book) {
    return `background:linear-gradient(135deg,${book.coverColor} 0%,${lighten(book.coverColor)} 100%)`;
  }

  function render() {
    const books    = Store.getList('books');
    const user     = Auth.current();
    const isProf   = user && user.role === 'professor';

    // 도서 상세 직접 표시 (쿼리 파라미터 ?id=)
    const detailId = Router.getParam('id');
    if (detailId) {
      return renderDetail(detailId, isProf);
    }

    const filtered = books.filter(b => {
      const catOk = _category === 'all' || b.category === _category;
      const qOk   = !_query  ||
        b.title.toLowerCase().includes(_query.toLowerCase()) ||
        b.authors.join(' ').includes(_query) ||
        b.category.includes(_query);
      return catOk && qOk;
    });

    return `
      <div>
        <div class="page-header">
          <div class="page-title">도서 둘러보기</div>
          <div class="page-desc">한빛아카데미 교재 ${books.length}종</div>
        </div>

        <div class="filter-bar">
          <input id="book-search" class="form-control" type="text"
            placeholder="도서명·저자·카테고리 검색..." value="${_query}"
            style="max-width:280px">
          <div class="filter-chips">
            ${CATEGORIES.map(c =>
              `<button class="filter-chip${_category===c?' active':''}" data-cat="${c}">
                ${c === 'all' ? '전체' : c}
              </button>`
            ).join('')}
          </div>
        </div>

        ${filtered.length === 0
          ? `<div class="empty-state">
              <div class="empty-title">검색 결과 없음</div>
              <div class="empty-desc">다른 검색어나 카테고리를 선택해보세요.</div>
            </div>`
          : `<div class="books-grid">${filtered.map(b => bookCard(b, isProf)).join('')}</div>`
        }
      </div>`;
  }

  function bookCard(b, isProf) {
    const route = isProf ? '#/professor/books' : '#/books';
    return `
      <div class="book-card" onclick="BookListView.openDetail('${b.id}')">
        <div class="book-cover" style="${coverBg(b)}">
          <div>
            <div style="font-size:18px;margin-bottom:6px">📚</div>
            <div style="font-size:11px;line-height:1.4">${b.title}</div>
          </div>
        </div>
        <div class="book-info">
          <div class="book-title">${b.title}</div>
          <div class="book-author">${b.authors.join(', ')}
            ${b.translators && b.translators.length ? ' / ' + b.translators.join(', ') + ' 옮김' : ''}
          </div>
          <div class="book-meta">
            <span class="book-price">${b.price.toLocaleString()}원</span>
          </div>
          <div class="book-tags">
            <span class="badge badge-muted">${b.category}</span>
            ${b.hasLectureMaterial ? '<span class="badge badge-success">강의자료</span>' : ''}
            ${b.digitalAvailable   ? '<span class="badge badge-info">전자책</span>'    : ''}
          </div>
        </div>
      </div>`;
  }

  function renderDetail(bookId, isProf) {
    const b = Store.findById('books', bookId);
    if (!b) return '<div class="empty-state"><div class="empty-title">도서를 찾을 수 없습니다.</div></div>';
    const backHash = isProf ? '#/professor/books' : '#/books';

    return `
      <div>
        <button class="btn btn-ghost btn-sm" style="margin-bottom:16px"
          onclick="location.hash='${backHash}'">← 목록으로</button>

        <div class="card" style="margin-bottom:20px">
          <div class="card-body">
            <div style="display:flex;gap:28px;align-items:flex-start">
              <div style="width:140px;height:190px;flex-shrink:0;border-radius:8px;
                ${coverBg(b)};display:flex;align-items:center;justify-content:center;
                color:white;font-size:13px;font-weight:700;text-align:center;padding:12px;
                line-height:1.4;text-shadow:0 1px 3px rgba(0,0,0,0.4)">
                📚<br><br>${b.title}
              </div>
              <div style="flex:1">
                <div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:6px">${b.title}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">
                  ${b.authors.join(', ')} 지음
                  ${b.translators && b.translators.length ? '/ ' + b.translators.join(', ') + ' 옮김' : ''}
                </div>
                <div style="font-size:24px;font-weight:700;color:var(--primary);margin:12px 0">
                  ${b.price.toLocaleString()}원
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
                  <span class="badge badge-muted">${b.category}</span>
                  ${b.hasLectureMaterial
                    ? '<span class="badge badge-success">강의자료 제공</span>'
                    : '<span class="badge badge-muted">강의자료 없음</span>'}
                  ${b.digitalAvailable
                    ? '<span class="badge badge-info">전자책 제공</span>'
                    : '<span class="badge badge-muted">전자책 없음</span>'}
                </div>
                <p style="font-size:13px;color:var(--text-muted);line-height:1.7">${b.description}</p>
                ${isProf ? `
                  <div class="divider"></div>
                  <div style="display:flex;gap:10px;flex-wrap:wrap">
                    <button class="btn btn-primary"
                      onclick="location.hash='#/professor/sample?book=${b.id}&type=paper'">
                      종이책 견본 신청
                    </button>
                    ${b.digitalAvailable ? `
                      <button class="btn btn-secondary"
                        onclick="location.hash='#/professor/sample?book=${b.id}&type=ebook'">
                        전자책 견본 신청
                      </button>` : ''}
                    ${b.hasLectureMaterial ? `
                      <button class="btn btn-outline"
                        onclick="location.hash='#/professor/materials?book=${b.id}'">
                        강의자료 다운로드
                      </button>` : ''}
                  </div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function openDetail(bookId) {
    const user    = Auth.current();
    const base    = user && user.role === 'professor' ? '#/professor/books' : '#/books';
    location.hash = base + '?id=' + bookId;
  }

  function attach() {
    const searchEl = document.getElementById('book-search');
    if (searchEl) {
      searchEl.oninput = e => { _query = e.target.value; Router.refresh(); };
    }
    document.querySelectorAll('.filter-chip[data-cat]').forEach(chip => {
      chip.onclick = () => { _category = chip.dataset.cat; Router.refresh(); };
    });
  }

  return { render, attach, openDetail };
})();
