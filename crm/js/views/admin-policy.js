// views/admin-policy.js
const AdminPolicyView = (() => {
  const EDITABLE_GRADES = ['A', 'B', 'C', 'New', 'Inactive'];
  const FIELDS = [
    { key: 'paper',    label: '종이책 (종/학기)' },
    { key: 'ebook',    label: '전자책 (종/학기)' },
    { key: 'material', label: '강의자료 (회/학기)' },
  ];

  function render() {
    const user = Auth.requireRole('admin');
    if (!user) return '';

    const policy = Store.get('quota_policy') || {};
    const allGrades = ['S', ...EDITABLE_GRADES];

    return `
      <div>
        <div class="page-header">
          <div class="page-title">한도 정책 마스터</div>
          <div class="page-desc">등급별 견본·강의자료 한도를 설정합니다. 저장 즉시 모든 신청 검증에 반영됩니다.</div>
        </div>

        <div class="card mb-20">
          <div class="card-header">
            <span class="card-title">등급별 한도 설정</span>
            <button class="btn btn-outline-gray btn-sm" onclick="AdminPolicyView.resetDefaults()">기본값 복원</button>
          </div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:100px">등급</th>
                  ${FIELDS.map(f => `<th>${f.label}</th>`).join('')}
                  <th style="width:60px">비고</th>
                </tr>
              </thead>
              <tbody>
                ${allGrades.map(g => {
                  const base    = Quota.QUOTA[g] || Quota.QUOTA.New;
                  const stored  = policy[g] || {};
                  const isS     = g === 'S';
                  return `
                    <tr>
                      <td>
                        <span class="grade-badge grade-${g}">${Quota.GRADE_LABELS[g]||g}</span>
                        ${stored.paper !== undefined || stored.ebook !== undefined || stored.material !== undefined
                          ? `<span class="badge badge-warning" style="margin-left:4px;font-size:10px">수정됨</span>`
                          : ''}
                      </td>
                      ${FIELDS.map(f => {
                        const baseVal = base[f.key];
                        const curVal  = stored[f.key] !== undefined ? stored[f.key] : baseVal;
                        if (isS) {
                          return `<td><span style="color:var(--text-muted);font-size:13px">무제한 (∞)</span></td>`;
                        }
                        return `<td>
                          <input type="number" class="form-control" style="width:80px;display:inline-block;text-align:center"
                            id="policy-${g}-${f.key}" value="${curVal === Infinity ? 999 : curVal}"
                            min="0" max="99"
                            ${g === 'Inactive' && f.key !== 'paper' ? '' : ''}>
                        </td>`;
                      }).join('')}
                      <td class="fs-xs text-muted">${isS ? 'S등급은 자동 전용' : ''}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="card-body" style="padding-top:0;border-top:none">
            <div style="display:flex;gap:10px;align-items:center">
              <button class="btn btn-primary" onclick="AdminPolicyView.save()">저장</button>
              <span class="fs-sm text-muted">저장하면 모든 신청 검증 로직에 즉시 반영됩니다.</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">현재 적용 중인 정책</span></div>
          <div class="card-body p-0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>등급</th>
                  ${FIELDS.map(f => `<th>${f.label}</th>`).join('')}
                  <th>적용 상태</th>
                </tr>
              </thead>
              <tbody>
                ${allGrades.map(g => {
                  const eff    = Quota.effectiveQuota(g);
                  const stored = policy[g];
                  const isCustom = !!stored;
                  return `<tr>
                    <td><span class="grade-badge grade-${g}">${Quota.GRADE_LABELS[g]||g}</span></td>
                    ${FIELDS.map(f => `<td class="fw-bold">${eff[f.key] === Infinity ? '무제한' : eff[f.key]}</td>`).join('')}
                    <td>${isCustom
                      ? '<span class="badge badge-warning">사용자 설정</span>'
                      : '<span class="badge badge-muted">기본값</span>'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function save() {
    const policy = Store.get('quota_policy') || {};
    EDITABLE_GRADES.forEach(g => {
      const row = {};
      FIELDS.forEach(f => {
        const el = document.getElementById(`policy-${g}-${f.key}`);
        if (el) row[f.key] = parseInt(el.value) || 0;
      });
      policy[g] = row;
    });
    Store.set('quota_policy', policy);
    Toast.success('정책이 저장되었습니다. 즉시 적용됩니다.');
    Router.refresh();
  }

  function resetDefaults() {
    Modal.confirm({
      title: '기본값 복원',
      message: 'PRD 3.1 기본값으로 모든 한도를 초기화합니다.',
      confirmText: '복원',
      onConfirm: () => {
        Store.remove('quota_policy');
        Toast.success('기본값으로 복원되었습니다.');
        Router.refresh();
      },
    });
  }

  function attach() {}
  return { render, attach, save, resetDefaults };
})();
