// app.js — SPA Router (hash routing, file:// compatible)
const Router = (() => {

  const ROUTE_TABLE = [
    { pattern: '#/login',                   view: () => LoginView,               title: '로그인',                 nav: false },
    { pattern: '#/professor/home',          view: () => ProfessorHomeView,       title: '내 홈',                  breadcrumb: '교강사 포털' },
    { pattern: '#/professor/books',         view: () => BookListView,            title: '도서 둘러보기',           breadcrumb: '교강사 포털' },
    { pattern: /^#\/professor\/sample/,     view: () => SampleRequestView,       title: '견본 도서 신청',         breadcrumb: '교강사 포털' },
    { pattern: '#/professor/materials',     view: () => LectureMaterialView,     title: '강의자료 다운로드',       breadcrumb: '교강사 포털' },
    { pattern: '#/professor/history',       view: () => HistoryView,             title: '내 신청·다운로드 내역',   breadcrumb: '교강사 포털' },
    { pattern: '#/professor/adoption',      view: () => AdoptionReportView,      title: '채택 자기신고',          breadcrumb: '교강사 포털' },
    // 관리자
    { pattern: '#/admin/home',              view: () => AdminHomeView,           title: '관리 홈',                breadcrumb: '관리자' },
    { pattern: '#/admin/verification',      view: () => AdminVerificationView,   title: '회원 검증',              breadcrumb: '관리자' },
    { pattern: '#/admin/sample-approval',   view: () => AdminSampleApprovalView, title: '견본 도서 승인',         breadcrumb: '관리자' },
    { pattern: '#/admin/professors',        view: () => AdminProfessorView,      title: '교강사 조회',            breadcrumb: '관리자' },
    { pattern: '#/admin/adoption-review',   view: () => AdminAdoptionReviewView, title: '채택 확인',              breadcrumb: '관리자' },
    { pattern: '#/admin/policy',            view: () => AdminPolicyView,         title: '한도 정책 마스터',       breadcrumb: '관리자' },
    { pattern: '#/admin/books',             view: () => AdminBooksView,          title: '도서 데이터 관리',       breadcrumb: '관리자' },
    // 분석
    { pattern: '#/dashboard',              view: () => DashboardView,            title: '대시보드',               breadcrumb: '분석' },
    { pattern: '#/grade-simulator',        view: () => GradeSimulatorView,       title: '등급 시뮬레이터',        breadcrumb: '분석' },
    // 하위 호환
    { pattern: '#/books',                  view: () => BookListView,             title: '도서 카탈로그' },
    { pattern: '#/professor/material',     view: () => LectureMaterialView,      title: '강의자료' },
  ];

  function matchRoute(hash) {
    const base = hash.split('?')[0];
    for (const r of ROUTE_TABLE) {
      if (r.pattern instanceof RegExp) {
        if (r.pattern.test(base)) return r;
      } else {
        if (r.pattern === base) return r;
      }
    }
    return null;
  }

  function currentHash() {
    return location.hash || '#/login';
  }

  function navigate() {
    const hash  = currentHash();
    const route = matchRoute(hash);

    // Close mobile sidebar on navigation
    Sidebar.closeMobile();

    if (!route) {
      const u = Auth.current();
      location.hash = u
        ? (u.role === 'professor' ? '#/professor/home' : '#/admin/home')
        : '#/login';
      return;
    }

    const viewObj = route.view();
    const noNav   = route.nav === false;

    if (typeof DashboardView !== 'undefined' && hash !== '#/dashboard') {
      DashboardView.destroyCharts();
    }

    const user = Auth.current();
    const isAdmin = user && (user.role === 'admin' || user.role === 'sales');

    let html;
    if (noNav) {
      html = `<div id="view-root">${viewObj.render()}</div>`;
    } else {
      html = `
        <div class="sidebar-overlay" onclick="Sidebar.closeMobile()"></div>
        <button class="hamburger-btn" onclick="Sidebar.toggleMobile()" aria-label="메뉴">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="layout">
          ${Sidebar.render(hash.split('?')[0])}
          <div class="main-area">
            ${Header.render(route.title, route.breadcrumb || '')}
            <main class="main-content">
              <div id="view-root">${viewObj.render()}</div>
            </main>
          </div>
        </div>
        ${isAdmin ? `
        <button class="floating-reset-btn" onclick="App.confirmReset()" title="데이터 초기화 (시드 리셋)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.27"/>
          </svg>
        </button>` : ''}`;
    }

    document.getElementById('app').innerHTML = html;

    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch {}
    }

    if (viewObj.attach) viewObj.attach();
    if (!noNav && typeof Header !== 'undefined' && Header.attach) Header.attach();

    const mc = document.querySelector('.main-content');
    if (mc) mc.scrollTop = 0;
  }

  function refresh() { navigate(); }

  function init() {
    Store.seed();
    window.addEventListener('hashchange', navigate);

    if (!location.hash || location.hash === '#') {
      const u = Auth.current();
      location.hash = u
        ? (u.role === 'professor' ? '#/professor/home' : '#/admin/home')
        : '#/login';
    } else {
      navigate();
    }
  }

  function getParam(name) {
    const qs = location.hash.split('?')[1] || '';
    return new URLSearchParams(qs).get(name);
  }

  return { navigate, refresh, init, currentHash, getParam };
})();

const App = (() => {
  function confirmReset() {
    Modal.confirm({
      title: '데이터 초기화',
      message: '모든 데이터를 초기 시드 상태로 되돌립니다. 이 작업은 취소할 수 없습니다.',
      confirmText: '초기화',
      danger: true,
      onConfirm: () => {
        Store.reset();
        Toast.info('초기화 완료. 새로고침합니다...');
        setTimeout(() => location.reload(), 800);
      },
    });
  }
  return { confirmReset };
})();

document.addEventListener('DOMContentLoaded', () => { Router.init(); });
