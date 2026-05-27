// views/grade-simulator.js
const GradeSimulatorView = (() => {
  let _selectedId  = null;
  let _bulkResults = null;

  // ── 점수 계산 ──────────────────────────────────────────────────────
  function _calcScore(profId) {
    const confirms = Store.getList('adoptions').filter(
      a => a.professorId === profId && a.status === 'confirmed'
    );
    const samples  = Store.getList('sample_requests').filter(
      r => r.professorId === profId && r.status === 'approved'
    );
    const matReqs  = Store.getList('material_requests').filter(
      r => r.professorId === profId && r.status === 'approved'
    );

    // 채택 연속성 (35점)
    const uniqueSems  = new Set(confirms.map(a => a.semester)).size;
    const totalConf   = confirms.length;
    const continuity  = Math.round(Math.min(uniqueSems / 2, 1) * 25 + Math.min(totalConf / 4, 1) * 10);

    // 채택 다양성 (20점)
    const uniqueBooks = new Set(confirms.map(a => a.bookId)).size;
    const diversity   = Math.round(Math.min(uniqueBooks / 2, 1) * 20);

    // 매출 기대치 (30점)
    const totalStudents = confirms.reduce(
      (s, a) => s + (a.students || a.expectedStudents || 0), 0
    );
    const revenue = Math.round(Math.min(totalStudents / 60, 1) * 30);

    // 고객 적극성 (15점)
    const contacts   = Store.getList('contact_notes').filter(n => n.professorId === profId).length;
    const engagement = Math.round(
      Math.min((samples.length + matReqs.length + contacts * 2) / 8, 1) * 15
    );

    const total = continuity + diversity + revenue + engagement;
    return { continuity, diversity, revenue, engagement, total };
  }

  function _gradeFromScore(total) {
    if (total >= 90) return 'S';
    if (total >= 70) return 'A';
    if (total >= 50) return 'B';
    if (total >= 30) return 'C';
    return 'Inactive';
  }

  // Grade rank: lower index = better
  const GRADE_RANK = ['S', 'A', 'B', 'C', 'New', 'Inactive'];

  function _gradeRank(g) {
    const idx = GRADE_RANK.indexOf(g);
    return idx === -1 ? 99 : idx;
  }

  // ── Scorecard HTML helper ──────────────────────────────────────────
  function _scorecardHtml(prof, score, newGrade) {
    const currentGrade = prof.grade || 'New';
    const curRank      = _gradeRank(currentGrade);
    const newRank      = _gradeRank(newGrade);

    let compareHtml;
    if (currentGrade === newGrade) {
      compareHtml = `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
                    border-radius:6px;background:#d4edda;color:#155724;font-size:13px">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          현재 등급과 동일합니다
        </div>`;
    } else {
      const arrow    = newRank < curRank ? '↑' : '↓';
      const arrowClr = newRank < curRank ? '#28a745' : '#dc3545';
      const bgClr    = newRank < curRank ? '#d4edda' : '#f8d7da';
      const txtClr   = newRank < curRank ? '#155724' : '#721c24';
      compareHtml = `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;
                    border-radius:6px;background:${bgClr};color:${txtClr};font-size:13px;font-weight:600">
          <span class="grade-badge grade-${currentGrade}">${currentGrade}</span>
          <span style="color:${arrowClr};font-size:18px">${arrow}</span>
          <span class="grade-badge grade-${newGrade}">${newGrade}</span>
          <span style="font-weight:400;margin-left:4px">
            ${newRank < curRank ? '등급 상승' : '등급 하락'}
          </span>
        </div>`;
    }

    function pct(v, max) { return Math.min(100, Math.round(v / max * 100)); }

    return `
      <div class="card" style="margin-top:20px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <span class="card-title">${prof.name} ${prof.title || ''} 점수 분석</span>
          <span class="grade-badge grade-${currentGrade}">${currentGrade}</span>
        </div>
        <div class="card-body">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
            ${prof.university || ''} ${prof.department || ''}
          </div>

          <div style="margin-bottom:20px">
            ${_scoreRow('채택 연속성', score.continuity, 35)}
            ${_scoreRow('채택 다양성', score.diversity, 20)}
            ${_scoreRow('매출 기대치', score.revenue, 30)}
            ${_scoreRow('고객 적극성', score.engagement, 15)}
          </div>

          <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;
                      padding:14px;border-radius:8px;background:var(--bg)">
            <div style="font-size:13px;color:var(--text-muted)">총점</div>
            <div style="font-size:32px;font-weight:800;color:var(--primary)">${score.total}</div>
            <div style="font-size:13px;color:var(--text-muted)">/ 100점</div>
          </div>

          <div class="grade-result ${newGrade}" style="margin-bottom:16px">
            <div class="grade-result-letter">${newGrade}</div>
            <div style="font-size:16px;font-weight:700;margin-top:4px">
              ${Quota.GRADE_LABELS[newGrade] || newGrade}
            </div>
          </div>

          <div style="margin-bottom:16px">${compareHtml}</div>

          <button class="btn btn-primary"
            onclick="GradeSimulatorView.applyOne('${prof.id}', '${newGrade}', ${score.total})">
            이 등급으로 적용
          </button>
        </div>
      </div>`;
  }

  function _scoreRow(label, value, max) {
    const pct = Math.min(100, Math.round(value / max * 100));
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:120px;font-size:12px;color:var(--text-muted);flex-shrink:0">${label}</div>
        <div style="flex:1;background:#e9ecef;border-radius:4px;height:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:4px;
                      transition:width 0.3s"></div>
        </div>
        <div style="font-size:12px;color:var(--text);width:56px;text-align:right;flex-shrink:0">
          ${value}/${max}점
        </div>
      </div>`;
  }

  // ── render ─────────────────────────────────────────────────────────
  function render() {
    const user = Auth.requireRole('admin', 'sales');
    if (!user) return '';

    const nonTempProfs = Store.getList('users').filter(
      u => u.role === 'professor' && !u.isTemp
    );

    const selectorOptions = nonTempProfs.map(p =>
      `<option value="${p.id}" ${p.id === _selectedId ? 'selected' : ''}>
        ${p.name} ${p.title || ''} — ${p.university || ''}
       </option>`
    ).join('');

    let scorecardHtml = '';
    if (_selectedId) {
      const prof = Store.findById('users', _selectedId);
      if (prof) {
        const score    = _calcScore(_selectedId);
        const newGrade = _gradeFromScore(score.total);
        scorecardHtml  = _scorecardHtml(prof, score, newGrade);
      }
    }

    return `
      <div>
        <div class="page-header">
          <div class="page-title">등급 시뮬레이터</div>
          <div class="page-desc">실제 데이터를 기반으로 교수회원의 예상 등급을 산정합니다.</div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">교강사 선택</span></div>
          <div class="card-body">
            <div class="form-group" style="max-width:480px">
              <label class="form-label">교강사</label>
              <select id="sim-prof-select" class="form-control form-select">
                <option value="">-- 교강사를 선택하세요 --</option>
                ${selectorOptions}
              </select>
            </div>

            <button class="btn btn-primary" style="margin-top:8px"
              onclick="GradeSimulatorView.runAll()">
              전체 자동 산정 실행
            </button>
          </div>
        </div>

        ${scorecardHtml}
      </div>`;
  }

  // ── attach ─────────────────────────────────────────────────────────
  function attach() {
    const sel = document.getElementById('sim-prof-select');
    if (sel) {
      sel.onchange = function (e) {
        GradeSimulatorView.selectProf(e.target.value);
      };
    }
  }

  // ── selectProf ─────────────────────────────────────────────────────
  function selectProf(profId) {
    _selectedId = profId || null;
    Router.refresh();
  }

  // ── runAll ─────────────────────────────────────────────────────────
  function runAll() {
    const nonTempProfs = Store.getList('users').filter(
      u => u.role === 'professor' && !u.isTemp
    );

    _bulkResults = nonTempProfs.map(p => {
      const score      = _calcScore(p.id);
      const newGrade   = _gradeFromScore(score.total);
      const curGrade   = p.grade || 'New';
      const curRank    = _gradeRank(curGrade);
      const newRank    = _gradeRank(newGrade);
      let changeType   = 'same';
      if (newRank < curRank) changeType = 'up';
      else if (newRank > curRank) changeType = 'down';
      return { prof: p, score, curGrade, newGrade, changeType };
    });

    const changedCount = _bulkResults.filter(r => r.changeType !== 'same').length;

    const tableRows = _bulkResults.map(r => {
      let changeBadge;
      if (r.changeType === 'up') {
        changeBadge = `<span style="color:#28a745;font-weight:700;font-size:16px">↑</span>`;
      } else if (r.changeType === 'down') {
        changeBadge = `<span style="color:#dc3545;font-weight:700;font-size:16px">↓</span>`;
      } else {
        changeBadge = `<span style="color:#adb5bd;font-size:16px">=</span>`;
      }

      return `<tr>
        <td>
          <div style="font-weight:600;font-size:13px">${r.prof.name} ${r.prof.title || ''}</div>
          <div style="font-size:11px;color:var(--text-muted)">${r.prof.university || ''}</div>
        </td>
        <td class="text-center">
          <span class="grade-badge grade-${r.curGrade}">${r.curGrade}</span>
        </td>
        <td class="text-center">
          <span class="grade-badge grade-${r.newGrade}">${r.newGrade}</span>
        </td>
        <td class="text-center" style="font-weight:700">${r.score.total}점</td>
        <td class="text-center">${changeBadge}</td>
      </tr>`;
    }).join('');

    const modalBody = `
      <div style="margin-bottom:12px;font-size:13px;color:var(--text-muted)">
        전체 <strong>${_bulkResults.length}명</strong> 중
        <strong style="color:var(--primary)">${changedCount}명</strong>의 등급 변동이 감지되었습니다.
      </div>
      <div style="overflow-x:auto;max-height:400px;overflow-y:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>이름/대학</th>
              <th>현재 등급</th>
              <th>시뮬레이션 등급</th>
              <th>점수</th>
              <th>변동</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`;

    const modalFooter = `
      <button class="btn btn-outline-gray" onclick="Modal.close()">취소</button>
      <button class="btn btn-primary" onclick="GradeSimulatorView.applyAll()">전체 적용</button>`;

    Modal.open({
      title: '전체 자동 산정 결과',
      body: modalBody,
      footer: modalFooter,
      size: 'lg'
    });
  }

  // ── applyAll ───────────────────────────────────────────────────────
  function applyAll() {
    if (!_bulkResults) return;

    const today = new Date().toISOString().slice(0, 10);
    let changedCount = 0;

    _bulkResults.forEach(r => {
      if (r.newGrade === r.curGrade) return;

      const users = Store.getList('users');
      const idx   = users.findIndex(u => u.id === r.prof.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], grade: r.newGrade };
        Store.setList('users', users);
      }

      const ghList = Store.getList('grade_history');
      ghList.push({
        id:             'GH_AUTO_' + r.prof.id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        professorId:    r.prof.id,
        fromGrade:      r.curGrade,
        toGrade:        r.newGrade,
        type:           'auto',
        reasonCategory: '자동산정',
        reason:         '자동 산정 점수 ' + r.score.total + '점 → ' + r.newGrade + '등급',
        adjustedBy:     'system',
        adjustedAt:     today
      });
      Store.setList('grade_history', ghList);
      changedCount++;
    });

    _bulkResults = null;
    Modal.close();
    Toast.success(changedCount + '명의 등급이 업데이트되었습니다.');
    Router.refresh();
  }

  // ── applyOne ───────────────────────────────────────────────────────
  function applyOne(profId, newGrade, score) {
    const prof = Store.findById('users', profId);
    if (!prof) return;
    const curGrade = prof.grade || 'New';

    Modal.confirm({
      title: '등급 적용',
      message: `${prof.name} 교강사의 등급을 <strong>${curGrade}</strong> → <strong>${newGrade}</strong>(으)로 변경하시겠습니까?<br>
                <span style="font-size:12px;color:var(--text-muted)">산정 점수: ${score}점</span>`,
      confirmText: '적용',
      onConfirm: function () {
        const today = new Date().toISOString().slice(0, 10);

        const users = Store.getList('users');
        const idx   = users.findIndex(u => u.id === profId);
        if (idx >= 0) {
          users[idx] = { ...users[idx], grade: newGrade };
          Store.setList('users', users);
        }

        const ghList = Store.getList('grade_history');
        ghList.push({
          id:             'GH_AUTO_' + profId + '_' + Date.now(),
          professorId:    profId,
          fromGrade:      curGrade,
          toGrade:        newGrade,
          type:           'auto',
          reasonCategory: '자동산정',
          reason:         '자동 산정 점수 ' + score + '점 → ' + newGrade + '등급',
          adjustedBy:     'system',
          adjustedAt:     today
        });
        Store.setList('grade_history', ghList);

        Toast.success(prof.name + ' 교강사 등급이 ' + newGrade + '로 변경되었습니다.');
        Router.refresh();
      }
    });
  }

  return { render, attach, selectProf, runAll, applyAll, applyOne };
})();
