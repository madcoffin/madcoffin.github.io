// views/dashboard.js
const DashboardView = (() => {
  let _charts = [];

  function destroyCharts() {
    _charts.forEach(c => { try { c.destroy(); } catch (_) {} });
    _charts = [];
  }

  function _last6Sems() {
    const cur = Quota.CURRENT_SEMESTER; // '2026-1'
    const parts = cur.split('-').map(Number);
    let yr = parts[0], sr = parts[1];
    const sems = [];
    for (let i = 0; i < 6; i++) {
      sems.unshift(yr + '-' + sr);
      sr--;
      if (sr === 0) { sr = 2; yr--; }
    }
    return sems;
  }

  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';
    destroyCharts();

    const allUsers   = Store.getList('users');
    const professors = allUsers.filter(u => u.role === 'professor' && !u.isTemp);
    const tempProfs  = allUsers.filter(u => u.role === 'professor' && u.isTemp === true);
    const adoptions  = Store.getList('adoptions');
    const samples    = Store.getList('sample_requests');

    const confirmedAdoptions = adoptions.filter(a => a.status === 'confirmed');
    const adoptionRatio = professors.length > 0
      ? (confirmedAdoptions.length / professors.length).toFixed(1)
      : '0.0';

    const pendingVerifications = allUsers.filter(u => u.role === 'professor' && !u.isTemp && !u.verifiedAt).length;
    const pendingSamples       = samples.filter(s => s.status === 'pending').length;
    const pendingAdoptions     = adoptions.filter(a => a.status === 'pending').length;
    const pendingCount         = pendingVerifications + pendingSamples + pendingAdoptions;

    return `
      <div>
        <div class="page-header">
          <div class="page-title">대시보드</div>
          <div class="page-desc">교강사 서비스 전체 현황 분석</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">${professors.length}</div>
              <div class="stat-label">총 교수회원 수</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">${tempProfs.length}</div>
              <div class="stat-label">비회원 교강사 수</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">${adoptionRatio}건/명</div>
              <div class="stat-label">채택 비율</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <div class="stat-value">${pendingCount}</div>
              <div class="stat-label">미처리 건수</div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="chart-card">
            <div class="chart-title">등급별 회원 분포</div>
            <div class="chart-container" style="height:220px">
              <canvas id="chart-grade"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-title">학기별 견본 증정 추이</div>
            <div class="chart-container" style="height:220px">
              <canvas id="chart-sample-trend"></canvas>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="chart-card">
            <div class="chart-title">강의자료 다운로드 Top 10</div>
            <div class="chart-container" style="height:280px">
              <canvas id="chart-dl-top"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-title">채택 추이</div>
            <div class="chart-container" style="height:280px">
              <canvas id="chart-adopt-trend"></canvas>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">영업자별 활동 리포트</span></div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>담당자</th>
                  <th>담당 교강사 수</th>
                  <th>등급 분포</th>
                  <th>이번학기 승인</th>
                  <th>이번학기 반려</th>
                </tr>
              </thead>
              <tbody id="sales-report-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function attach() {
    if (typeof Chart === 'undefined') return;

    const allUsers   = Store.getList('users');
    const professors = allUsers.filter(u => u.role === 'professor' && !u.isTemp);
    const samples    = Store.getList('sample_requests');
    const matReqs    = Store.getList('material_requests');
    const adoptions  = Store.getList('adoptions');
    const books      = Store.getList('books');
    const sems6      = _last6Sems();
    const curSem     = Quota.CURRENT_SEMESTER;

    const COLORS = {
      primary:   '#1F4E79',
      secondary: '#2E75B6',
      success:   '#28A745',
      warning:   '#FFC107',
      danger:    '#DC3545',
      info:      '#17A2B8',
      muted:     '#ADB5BD',
    };
    const gradeColors = {
      S: '#FFD700', A: '#C0C0C0', B: '#CD7F32',
      C: '#6C757D', New: '#17A2B8', Inactive: '#ADB5BD'
    };

    // ── 등급별 도넛 차트 ──────────────────────────────────────────────
    const gradeOrder = ['S', 'A', 'B', 'C', 'New', 'Inactive'];
    const gradeCount = {};
    professors.forEach(p => {
      const g = p.grade || 'New';
      gradeCount[g] = (gradeCount[g] || 0) + 1;
    });
    const gradeKeys = gradeOrder.filter(g => gradeCount[g]);
    const gc = document.getElementById('chart-grade');
    if (gc) {
      const c = new Chart(gc, {
        type: 'doughnut',
        data: {
          labels: gradeKeys.map(g => Quota.GRADE_LABELS[g] || g),
          datasets: [{
            data: gradeKeys.map(g => gradeCount[g]),
            backgroundColor: gradeKeys.map(g => gradeColors[g] || '#999'),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { font: { size: 12 } } } }
        }
      });
      _charts.push(c);
    }

    // ── 학기별 견본 증정 추이 (stacked bar) ──────────────────────────
    const paperBySem = {}, ebookBySem = {};
    sems6.forEach(s => { paperBySem[s] = 0; ebookBySem[s] = 0; });
    samples.filter(s => s.status === 'approved').forEach(s => {
      if (paperBySem.hasOwnProperty(s.semester)) {
        if (s.type === 'paper') paperBySem[s.semester]++;
        else if (s.type === 'ebook') ebookBySem[s.semester]++;
      }
    });
    const stEl = document.getElementById('chart-sample-trend');
    if (stEl) {
      const c = new Chart(stEl, {
        type: 'bar',
        data: {
          labels: sems6,
          datasets: [
            {
              label: '종이책',
              data: sems6.map(s => paperBySem[s]),
              backgroundColor: COLORS.primary,
              borderRadius: 3,
              stack: 'stack'
            },
            {
              label: '전자책',
              data: sems6.map(s => ebookBySem[s]),
              backgroundColor: COLORS.secondary,
              borderRadius: 3,
              stack: 'stack'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
      _charts.push(c);
    }

    // ── 강의자료 다운로드 Top 10 (horizontal bar) ─────────────────────
    const dlCount = {};
    matReqs.filter(r => r.status === 'approved').forEach(r => {
      dlCount[r.bookId] = (dlCount[r.bookId] || 0) + 1;
    });
    const top10 = Object.entries(dlCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const dlEl = document.getElementById('chart-dl-top');
    if (dlEl) {
      const labels = top10.map(([bid]) => {
        const b = books.find(bk => bk.id === bid);
        const title = b ? b.title : bid;
        return title.length > 16 ? title.slice(0, 16) + '…' : title;
      });
      const c = new Chart(dlEl, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '다운로드 수',
            data: top10.map(([, cnt]) => cnt),
            backgroundColor: COLORS.secondary,
            borderRadius: 3
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { ticks: { font: { size: 11 } } }
          }
        }
      });
      _charts.push(c);
    }

    // ── 채택 추이 선 차트 ─────────────────────────────────────────────
    const adoptBySem = {}, sampleApprBySem = {};
    sems6.forEach(s => { adoptBySem[s] = 0; sampleApprBySem[s] = 0; });
    adoptions.filter(a => a.status === 'confirmed').forEach(a => {
      if (adoptBySem.hasOwnProperty(a.semester)) adoptBySem[a.semester]++;
    });
    samples.filter(s => s.status === 'approved').forEach(s => {
      if (sampleApprBySem.hasOwnProperty(s.semester)) sampleApprBySem[s.semester]++;
    });
    const atEl = document.getElementById('chart-adopt-trend');
    if (atEl) {
      const c = new Chart(atEl, {
        type: 'line',
        data: {
          labels: sems6,
          datasets: [
            {
              label: '확정 채택',
              data: sems6.map(s => adoptBySem[s]),
              borderColor: COLORS.primary,
              backgroundColor: 'rgba(31,78,121,0.1)',
              tension: 0.3,
              fill: true,
              pointBackgroundColor: COLORS.primary,
              pointRadius: 4
            },
            {
              label: '견본 승인',
              data: sems6.map(s => sampleApprBySem[s]),
              borderColor: COLORS.secondary,
              backgroundColor: 'rgba(46,117,182,0.05)',
              tension: 0.3,
              fill: false,
              borderDash: [6, 3],
              pointBackgroundColor: COLORS.secondary,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
      _charts.push(c);
    }

    // ── 영업자별 활동 리포트 ──────────────────────────────────────────
    const salesUsers = allUsers.filter(u => u.role === 'sales' || u.role === 'admin');
    const salesMap = {}; // salesId -> { name, profs: [] }
    salesUsers.forEach(s => { salesMap[s.id] = { name: s.name, profs: [] }; });
    salesMap['미배정'] = { name: '미배정', profs: [] };

    const allProfs = allUsers.filter(u => u.role === 'professor');
    allProfs.forEach(p => {
      const key = (p.assignedTo && salesMap[p.assignedTo]) ? p.assignedTo : '미배정';
      salesMap[key].profs.push(p);
    });

    const tbody = document.getElementById('sales-report-tbody');
    if (tbody) {
      const rows = Object.entries(salesMap)
        .filter(([, v]) => v.profs.length > 0)
        .map(([sid, { name, profs }]) => {
          const gradeDist = {};
          profs.forEach(p => {
            const g = p.grade || (p.isTemp ? '비회원' : 'New');
            gradeDist[g] = (gradeDist[g] || 0) + 1;
          });

          const badgeOrder = ['S', 'A', 'B', 'C', 'New', 'Inactive', '비회원'];
          const badges = badgeOrder
            .filter(g => gradeDist[g])
            .map(g => {
              const cls = g === '비회원' ? 'grade-badge' : `grade-badge grade-${g}`;
              return `<span class="${cls}" style="margin-right:3px;font-size:10px">${g}×${gradeDist[g]}</span>`;
            }).join('');

          const profIds = profs.map(p => p.id);

          const thisApproved = samples.filter(s =>
            profIds.includes(s.professorId) &&
            s.semester === curSem &&
            s.status === 'approved'
          ).length;

          const thisRejected = samples.filter(s =>
            profIds.includes(s.professorId) &&
            s.semester === curSem &&
            s.status === 'rejected'
          ).length;

          const displayName = sid === '미배정' ? '미배정' : name;

          return `<tr>
            <td style="font-weight:600;font-size:13px">${displayName}</td>
            <td class="text-center">${profs.length}명</td>
            <td>${badges || '-'}</td>
            <td class="text-center">
              <span class="badge badge-success">${thisApproved}건</span>
            </td>
            <td class="text-center">
              <span class="badge badge-danger">${thisRejected}건</span>
            </td>
          </tr>`;
        });

      tbody.innerHTML = rows.join('') ||
        '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">데이터가 없습니다.</td></tr>';
    }
  }

  return { render, attach, destroyCharts };
})();
