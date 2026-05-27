// quota.js — grade-based quota calculation
const QUOTA = {
  S:        { paper: Infinity, ebook: Infinity, material: Infinity,
              label: '학기당 종이책 무제한 / 전자책 무제한 / 강의자료 무제한' },
  A:        { paper: 3, ebook: 6, material: 6,
              label: '학기당 종이책 3종 / 전자책 6종 / 강의자료 6회' },
  B:        { paper: 2, ebook: 3, material: 3,
              label: '학기당 종이책 2종 / 전자책 3종 / 강의자료 3회' },
  C:        { paper: 1, ebook: 3, material: 2,
              label: '학기당 종이책 1종 / 전자책 3종 / 강의자료 2회 (강의계획서 필요)' },
  Inactive: { paper: 0, ebook: 0, material: 0,
              label: '원칙적으로 신청 제한' },
  New:      { paper: 2, ebook: 3, material: 3,
              label: 'B등급 수준 — 학기당 종이책 2종 / 전자책 3종 / 강의자료 3회' },
};

const GRADE_LABELS = {
  S: 'S등급', A: 'A등급', B: 'B등급', C: 'C등급', Inactive: '비활성', New: '신규'
};

const CURRENT_SEMESTER = '2026-1';

const Quota = (() => {

  /**
   * 특정 사용자의 학기 내 실제 사용량을 반환합니다.
   * @returns {{ paper: number, ebook: number, material: Set<string> }}
   *   material 은 이미 다운로드(신청)한 bookId 집합
   */
  function getCurrentUsage(userId, semester) {
    const sem = semester || CURRENT_SEMESTER;
    const requests = Store.getList('sample_requests');
    const matReqs  = Store.getList('material_requests');

    const semReqs = requests.filter(r =>
      r.professorId === userId && r.semester === sem && r.status !== 'rejected'
    );

    const paper = semReqs.filter(r => r.type === 'paper').length;
    const ebook = semReqs.filter(r => r.type === 'ebook').length;

    // 강의자료는 같은 bookId를 재다운로드해도 한 번만 차감
    const materialSet = new Set(
      matReqs
        .filter(r => r.professorId === userId && r.status !== 'rejected')
        .map(r => r.bookId)
    );

    return { paper, ebook, material: materialSet };
  }

  /**
   * 신청/다운로드 가능 여부를 검증합니다.
   * @param {string} userId
   * @param {'paper'|'ebook'|'material'} type
   * @param {string} bookId  — material 타입일 때 중복 체크에 사용
   * @returns {{ allowed: boolean, reason?: string, remaining: number,
   *             suggestEbook?: boolean, alreadyDownloaded?: boolean }}
   */
  function effectiveQuota(grade) {
    const policy = Store.get('quota_policy');
    if (!policy || !policy[grade]) return QUOTA[grade] || QUOTA.New;
    return Object.assign({}, QUOTA[grade] || QUOTA.New, policy[grade]);
  }

  function checkQuota(userId, type, bookId) {
    const user = Store.findById('users', userId);
    if (!user) return { allowed: false, reason: '사용자 정보를 찾을 수 없습니다.', remaining: 0 };

    const grade  = user.grade || 'New';
    const limits = effectiveQuota(grade);

    // 비활성 등급은 모두 차단
    if (grade === 'Inactive') {
      return {
        allowed: false,
        reason: '비활성 등급은 서비스 이용이 제한됩니다. 담당 영업자에게 문의하세요.',
        remaining: 0,
      };
    }

    const usage = getCurrentUsage(userId, CURRENT_SEMESTER);

    if (type === 'paper') {
      const limit     = limits.paper;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usage.paper);
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `현재 등급(${GRADE_LABELS[grade]})은 학기당 종이책 ${limit}종까지 신청 가능합니다. 전자책으로 전환을 권장합니다.`,
          remaining: 0,
          suggestEbook: true,
        };
      }
      return { allowed: true, remaining };
    }

    if (type === 'ebook') {
      const limit     = limits.ebook;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usage.ebook);
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `현재 등급(${GRADE_LABELS[grade]})은 학기당 전자책 ${limit}종까지 신청 가능합니다.`,
          remaining: 0,
        };
      }
      return { allowed: true, remaining };
    }

    if (type === 'material') {
      // 이미 해당 bookId를 다운로드한 경우: 한도 차감 없이 허용
      if (bookId && usage.material.has(bookId)) {
        return { allowed: true, remaining: 0, alreadyDownloaded: true };
      }
      const limit     = limits.material;
      const matUsed   = usage.material.size;
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - matUsed);
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `현재 등급(${GRADE_LABELS[grade]})은 학기당 강의자료 ${limit}종까지 다운로드 가능합니다.`,
          remaining: 0,
        };
      }
      if (grade === 'C') {
        return { allowed: true, remaining, requiresCoursePlan: true };
      }
      return { allowed: true, remaining };
    }

    return { allowed: false, reason: '알 수 없는 신청 유형입니다.', remaining: 0 };
  }

  // 하위 호환 헬퍼 (기존 코드용)
  function used(professorId, semester) {
    const u = getCurrentUsage(professorId, semester);
    return { paper: u.paper, ebook: u.ebook, material: u.material.size };
  }

  function remaining(professorId, grade, semester) {
    const limits = QUOTA[grade] || QUOTA.New;
    const u      = getCurrentUsage(professorId, semester);
    return {
      paper:    limits.paper    === Infinity ? Infinity : Math.max(0, limits.paper    - u.paper),
      ebook:    limits.ebook    === Infinity ? Infinity : Math.max(0, limits.ebook    - u.ebook),
      material: limits.material === Infinity ? Infinity : Math.max(0, limits.material - u.material.size),
    };
  }

  function pct(usedN, limit) {
    if (limit === Infinity || limit === 0) return 0;
    return Math.min(100, Math.round(usedN / limit * 100));
  }

  function fillClass(p) {
    if (p >= 100) return 'full';
    if (p >= 70)  return 'warn';
    return 'ok';
  }

  function canRequest(professorId, grade, semester, type) {
    const rem = remaining(professorId, grade, semester);
    if (type === 'paper')    return rem.paper    > 0;
    if (type === 'ebook')    return rem.ebook    > 0;
    if (type === 'material') return rem.material > 0;
    return false;
  }

  return {
    getCurrentUsage, checkQuota, effectiveQuota,
    used, remaining, pct, fillClass, canRequest,
    QUOTA, GRADE_LABELS, CURRENT_SEMESTER,
  };
})();
