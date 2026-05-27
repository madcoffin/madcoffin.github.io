// views/login.js
const LoginView = (() => {
  function render() {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-header">
            <div class="login-brand">한빛 교수전용공간</div>
            <div class="login-sub">한빛아카데미 교강사 서비스 포털 · CRM 프로토타입</div>
          </div>
          <div class="login-body">
            <div class="login-tabs">
              <button class="login-tab active" data-tab="professor">교강사</button>
              <button class="login-tab" data-tab="admin">관리자/영업</button>
            </div>

            <div id="tab-professor">
              <div class="form-group">
                <label class="form-label">아이디</label>
                <input id="login-id-input" class="form-control" type="text" placeholder="아이디를 입력하세요" autofocus>
              </div>
              <button class="btn btn-primary btn-full btn-lg" id="login-btn" style="margin-top:4px">로그인</button>
              <div class="demo-accounts" style="margin-top:20px">
                <div class="demo-title">데모 계정 (클릭하면 자동 입력)</div>
                <div class="demo-item"><span class="demo-id" data-id="kmj">kmj</span><span class="demo-desc">김민정 교수 / 서울대 / S등급</span></div>
                <div class="demo-item"><span class="demo-id" data-id="lsh">lsh</span><span class="demo-desc">이상훈 교수 / 연세대 / A등급</span></div>
                <div class="demo-item"><span class="demo-id" data-id="pjy">pjy</span><span class="demo-desc">박지영 교수 / 부산대 / B등급</span></div>
                <div class="demo-item"><span class="demo-id" data-id="jhw">jhw</span><span class="demo-desc">정현우 강사 / 한양대 / 신규(전환 대기)</span></div>
              </div>
            </div>

            <div id="tab-admin" style="display:none">
              <div class="form-group">
                <label class="form-label">아이디</label>
                <input id="login-id-input-admin" class="form-control" type="text" placeholder="아이디를 입력하세요">
              </div>
              <button class="btn btn-primary btn-full btn-lg" id="login-btn-admin" style="margin-top:4px">로그인</button>
              <div class="demo-accounts" style="margin-top:20px">
                <div class="demo-title">데모 계정</div>
                <div class="demo-item"><span class="demo-id" data-id="admin01" data-target="admin">admin01</span><span class="demo-desc">김팀장 / 관리자</span></div>
                <div class="demo-item"><span class="demo-id" data-id="sales01" data-target="admin">sales01</span><span class="demo-desc">최영업 / 영업 담당자</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function attach() {
    const tabs = document.querySelectorAll('.login-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-professor').style.display = tab.dataset.tab === 'professor' ? '' : 'none';
        document.getElementById('tab-admin').style.display     = tab.dataset.tab === 'admin'     ? '' : 'none';
      };
    });

    function doLogin(inputId) {
      const id = document.getElementById(inputId).value.trim();
      if (!id) { Toast.warning('아이디를 입력해주세요.'); return; }
      const user = Auth.login(id);
      if (!user) { Toast.error('존재하지 않는 계정입니다.'); return; }
      Toast.success(`${user.name}님, 환영합니다!`);
      setTimeout(() => {
        if (user.role === 'professor') location.hash = '#/professor/home';
        else location.hash = '#/admin/home';
      }, 300);
    }

    document.getElementById('login-btn').onclick = () => doLogin('login-id-input');
    document.getElementById('login-btn-admin').onclick = () => doLogin('login-id-input-admin');

    document.getElementById('login-id-input').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin('login-id-input'); });
    document.getElementById('login-id-input-admin').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin('login-id-input-admin'); });

    document.querySelectorAll('.demo-id').forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.target === 'admin' ? 'login-id-input-admin' : 'login-id-input';
        const targetEl = document.getElementById(target);
        if (targetEl) targetEl.value = btn.dataset.id;
      };
    });
  }

  return { render, attach };
})();
