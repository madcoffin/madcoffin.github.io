# 한빛아카데미 교강사 CRM 프로토타입

교강사 서비스 및 관리자 운영을 위한 SPA(Single Page Application) 프로토타입입니다.  
외부 서버·빌드 도구 없이 브라우저에서 바로 실행됩니다.

---

## 실행 방법 (5분 퀵스타트)

```bash
# 저장소 클론
git clone <repo-url>
cd crm

# 브라우저에서 열기 (더블클릭 또는 아래 명령어)
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

> **요구사항**: Chrome / Edge / Firefox 최신 버전. Node.js 불필요.  
> localStorage에 시드 데이터가 자동 초기화됩니다.

---

## 시드 계정

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 관리자 | admin@hanbit.co.kr | admin123 | 전체 관리 기능 |
| 영업담당 | sales@hanbit.co.kr | sales123 | 관리자와 동일 화면 |
| 교강사 (S등급) | kmj@sejong.ac.kr | prof123 | 김민준 · 세종대 |
| 교강사 (A등급) | lsh@korea.ac.kr | prof123 | 이서현 · 고려대 |
| 교강사 (B등급) | pjy@snu.ac.kr | prof123 | 박지영 · 서울대 |
| 교강사 (New등급) | jhw@yonsei.ac.kr | prof123 | 정하운 · 연세대 |

---

## 화면별 기능

### 교강사 포털

| 화면 | URL | 주요 기능 |
|------|-----|-----------|
| 내 홈 | `#/professor/home` | 알림 목록, 신청 현황 위젯 |
| 도서 둘러보기 | `#/professor/books` | 카테고리 필터, 견본신청 바로가기 |
| 견본 도서 신청 | `#/professor/sample` | 종이책/전자책 선택, 학기별 한도 검증 |
| 강의자료 다운로드 | `#/professor/materials` | 도서별 강의자료 Blob 다운로드 |
| 채택 자기신고 | `#/professor/adoption` | 강의계획서 첨부, 수강인원 입력 |
| 내 신청 내역 | `#/professor/history` | 견본·다운로드 통합 내역 |

### 관리자

| 화면 | URL | 주요 기능 |
|------|-----|-----------|
| 관리 홈 | `#/admin/home` | 대기 건수 위젯, 최근 활동 피드 |
| 회원 검증 | `#/admin/verification` | 좌우 Split 패널, 승인(New등급 배정)·거절(사유 필수) |
| 견본 승인 | `#/admin/sample-approval` | 초과 신청 예외처리(사유 필수), 거절 사유 기록 |
| 교강사 조회 | `#/admin/professors` | 검색·등급 필터, 6탭 상세(기본/채택/증정/다운로드/접촉/등급이력) |
| 채택 확인 | `#/admin/adoption-review` | 강의계획서 확인, 거절 시 상태 보존 |
| 한도 정책 | `#/admin/policy` | 등급별 한도 수정·저장, 즉시 반영 |
| 도서 관리 | `#/admin/books` | 도서 추가·편집, 강의자료 보유 여부 토글 |

### 분석

| 화면 | URL | 주요 기능 |
|------|-----|-----------|
| 대시보드 | `#/dashboard` | 4종 통계 위젯 + 5개 Chart.js 차트 |
| 등급 시뮬레이터 | `#/grade-simulator` | 개인/일괄 등급 시뮬레이션, 변동 리포트 모달 |

---

## 등급 산정 기준

총점 100점, 기준 아래 등급 자동 배정:

| 등급 | 임계점 |
|------|--------|
| S | ≥ 90 |
| A | ≥ 70 |
| B | ≥ 50 |
| C | ≥ 30 |
| Inactive | < 30 |

**채점 항목 (4개 × 100점)**

| 항목 | 배점 | 산출 방식 |
|------|------|-----------|
| 채택 연속성 | 35점 | 고유학기 수 / 2 × 25 + 총 교재확정 수 / 4 × 10 |
| 채택 다양성 | 20점 | 고유도서 수 / 2 × 20 |
| 매출 기대치 | 30점 | 총 수강인원 / 60 × 30 |
| 고객 적극성 | 15점 | (견본신청 + 자료요청 + 접촉이력×2) / 8 × 15 |

---

## 데이터 초기화

관리자 화면 우측 하단 **초기화 버튼(↺)** 클릭 → 시드 데이터로 복원됩니다.

---

## 프로젝트 구조

```
crm/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── seed-data.js        # 시드 데이터 정의
    ├── store.js            # localStorage CRUD
    ├── auth.js             # 로그인·세션 관리
    ├── quota.js            # 등급별 한도, effectiveQuota()
    ├── app.js              # SPA 라우터, App 모듈
    ├── components/
    │   ├── header.js       # 상단바, 알림 드롭다운
    │   ├── sidebar.js      # 사이드 내비게이션
    │   ├── modal.js        # 공통 모달 (ESC 지원)
    │   └── toast.js        # 토스트 알림 (4초)
    └── views/
        ├── login.js
        ├── professor-home.js
        ├── book-list.js
        ├── sample-request.js
        ├── lecture-material.js
        ├── history.js
        ├── adoption-report.js
        ├── admin-home.js
        ├── admin-verification.js
        ├── admin-sample-approval.js
        ├── admin-professor-view.js
        ├── admin-adoption-review.js
        ├── admin-policy.js
        ├── admin-books.js
        ├── dashboard.js
        └── grade-simulator.js
```

---

## 개발 단계별 작업 내역

### 1단계 — 교강사 포털 핵심 화면
- 로그인, 내 홈, 도서 둘러보기, 견본 신청, 강의자료 다운로드, 채택 자기신고, 신청 내역
- 등급별 한도 검증 (`Quota.checkQuota`)
- 알림 생성·읽음 처리

### 2단계 — 관리자 운영 화면
- 헤더 알림 벨 (대기 건수 드롭다운)
- 회원 검증: Split 레이아웃, 등급·담당자 자동 배정, 거절 사유 필수
- 견본 승인: 초과 신청 감지(exception badge), 예외 승인 사유 필수
- 채택 확인: 거절 시 레코드 보존 (`status='rejected'`)
- 교강사 조회: 6탭 상세 패널, 수동 등급 변경(7개 사유 카테고리), 접촉 이력 추가

### 3단계 — 인사이트 · 자동화 · 완성도
- 대시보드: Chart.js 5개 차트 (도넛/스택바/가로바/꺾은선/영업 테이블)
- 등급 시뮬레이터: 개인 미리보기 + 일괄 실행 + 변동 리포트 모달 + 일괄 적용
- 한도 정책 마스터: 등급별 한도 편집 → localStorage 저장 → 신청 화면 즉시 반영
- 도서 관리: 도서 추가·편집, 체크박스 토글 즉시 저장
- 반응형: 768–1024px 아이콘 전용 사이드바, 768px 이하 햄버거 메뉴
- 모달 ESC 닫기, 토스트 4초 기본값

---

## 향후 확장 포인트

- **백엔드 연동**: `store.js`의 localStorage 호출을 REST API fetch로 교체
- **인증 강화**: JWT 토큰 기반 세션, refresh 토큰 처리
- **파일 업로드**: 강의계획서·강의자료 실제 S3/Cloud Storage 업로드
- **실시간 알림**: WebSocket 또는 SSE로 관리자 대기 건수 실시간 갱신
- **이메일 발송**: 승인/거절 시 교강사 자동 안내 메일
- **다국어 지원**: i18n 키-값 분리 (현재 한국어 하드코딩)
