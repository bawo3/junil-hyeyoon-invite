# 💍 모바일 청첩장

겨울 스틸블루 · 은청 톤에 후지산 실루엣 워터마크 + 은은한 눈 효과를 더한 고급스러운 모바일 청첩장 정적 사이트.
청첩장 정보의 초기 기본값은 `setting.json`에 있고, 예식 일자·예식장·계좌·연락처처럼 자주 바뀌는 값은 관리자 페이지(`photo.html`)에서 Vercel KV로 실시간 수정합니다.

---

## ✨ 주요 기능

| 섹션 | 내용 |
|------|------|
| **커버** | 배경 영상(기본) 또는 photo.html에서 등록한 메인 사진 중 택1(`/api/cover`) + 후지산 실루엣 워터마크 + 은은한 눈 효과 + 신랑신부 이름(photo.html "신랑/신부 본인" 예금주 값 우선 반영) |
| **인사말** | 시집 스타일의 고급스러운 영문/한글 인용구 + 본문 |
| **혼주 소개** | 신랑/신부 부모님 + 전화 연결 버튼 (Glass 카드) |
| **예식 일정** | 연도 + 월·일·요일 3분할 + 시간 + D-Day 뱃지 + 달력(예식일 펄스 애니메이션) + photo.html에서 등록 시에만 표시되는 일정 사진 |
| **오시는 길** | 좌표가 있으면 카카오맵 JS SDK, 없으면 Google Maps 임베드로 자동 폴백 + 주소 카드 + 길찾기 모달 + 웨딩홀 사진(섹션 최상단) + 교통 정보 |
| **마음 전하기** | 신랑(턱시도)/신부(면사포) 캐릭터 + 송금 모달 (토스/카카오페이/복사) |
| **갤러리** | 사진 슬라이더 (자동재생, 점 인디케이터, 썸네일) |
| **RSVP** | 참석 여부 폼 (이름·연락처·참석여부 필수, 인원 수) |
| **공유하기** | 청첩장 하단 카카오톡 공유 + 링크 복사 (지금 보고 있는 URL·`?contact=` 상태 그대로 공유) |

---

## 🗂 파일 구조

```
WEDDING-CARD/
├── index.html               # 메인 청첩장 (HTML + CSS + JS 통합)
├── groom-parent_2.html      # 신랑측 혼주용 변형
├── bride-parent_3.html      # 신부측 혼주용 변형
├── link.html / girl_link.html / man_link.html  # 공유 진입 페이지
├── nav.html                 # 길찾기 단독 페이지
├── cal.html                  # 일정 등록 (Google Calendar 알림)
├── photo.html                # 관리자 페이지 (사진/예식 일자/예식장/교통정보/계좌·연락처)
├── result.html                # RSVP 집계 관리 페이지
├── setting.json               # 청첩장 정보 초기 기본값 (Vercel KV가 없을 때만 사용)
├── api/                        # Vercel Serverless Functions
│   ├── venue.js               # 예식장·추가 장소·교통정보 저장 (GET/PUT)
│   ├── date.js                 # 예식 일자 + 일정 사진 저장 (GET/PUT)
│   ├── cover.js                 # 커버 표시 방식(영상/사진)·사진 저장 (GET/PUT)
│   ├── geocode.js              # 주소 → 좌표 변환 (카카오 로컬 API 프록시, GET)
│   ├── accounts.js             # 계좌 정보(+ 신랑/신부 표시 이름) 저장 (GET/PUT)
│   ├── parents.js              # 혼주·본인 연락처 저장 (GET/PUT)
│   ├── photos.js               # 갤러리 사진 저장 (GET/POST/DELETE)
│   └── rsvp.js                 # 참석 회신 저장 (GET/POST/DELETE)
├── images/                     # 갤러리 이미지
│   ├── photo1.svg
│   ├── photo2.svg
│   └── photo3.svg
└── README.md
```

> `setting.json`과 Vercel KV(`api/*.js`)의 관계, 우선순위는 [`청첩장_기능분석.md`의 2번 항목](청첩장_기능분석.md#2-설정-관리-settingjson--vercel-kv-이원화) 참고.

---

## ⚙️ setting.json 구조

```json
{
  "wedding": {
    "groom":   { "name", "englishName", "fatherName", "motherName", "contact" },
    "bride":   { "name", "englishName", "fatherName", "motherName", "contact" },
    "date":    { "year", "month", "day", "dayOfWeek", "time" },
    "venue":   { "name", "hall", "address", "lat", "lng", "photo" },
    "message": { "main", "sub", "invitation" },
    "account": { "groom":{bank,number,holder}, "bride":{...} },
    "gallery": { "enabled", "photos":[{src, caption}] },
    "rsvp":    { "enabled" }
  }
}
```

청첩장의 **초기 기본값**은 `setting.json`에 있지만, 아래 항목들은 운영 중 실시간으로 바뀌는 값이라 **photo.html 관리자 페이지 → Vercel KV**가 우선합니다 (`setting.json`은 KV가 비어있을 때만 쓰이는 폴백):

| 항목 | 관리 화면 | 저장 위치 |
|---|---|---|
| 커버 표시 방식(영상/사진)·사진 | photo.html 최상단 "🖼 메인 사진 (커버)" | `/api/cover` |
| 예식 일자·시간·일정 사진 | photo.html "📅 예식 일자 관리" | `/api/date` |
| 예식장 이름/홀/길찾기 이름/주소/좌표/사진, 추가 장소, 교통정보 | photo.html "🏛️ 예식장 정보 관리" 외 | `/api/venue` |
| 계좌·혼주 연락처(신랑/신부 표시 이름 포함) | photo.html "💳📞 계좌 · 연락처 관리" | `/api/accounts`, `/api/parents` |
| 갤러리 사진 | photo.html 상단 업로드 영역 | `/api/photos` |

> 신랑/신부 이름은 setting.json이 기본값이지만, photo.html "신랑 본인/신부 본인" 예금주 칸에 저장한 값이 있으면 표지·카카오 공유 카드 이름도 그 값으로 덮어씁니다. 성이 필요 없는 자리(표지 타이틀, 공유 카드)는 `shortName()`이 맨 앞 성 1글자를 잘라 자동 표시합니다.
>
> 사진 업로드는 원본 파일 기준 **2.5MB 초과 시 업로드가 거부**됩니다(갤러리/예식장/커버/일정 사진 공통, `compressImage()`에서 검증).

RSVP 회신 마감일은 더 이상 별도 값을 저장하지 않고, **예식 일자 기준 3주 전을 자동 계산**해서 표시합니다.

단, **카카오톡 공유 시 뜨는 미리보기 문구**(`<meta name="description">` 등)는 메신저가 JS 없이 HTML만 읽어가기 때문에 위 KV 값이 자동 반영되지 않습니다 — 예식장·날짜가 바뀌면 각 HTML 파일의 `<head>` 메타 태그와 `setting.json`의 `site.description`을 손으로 함께 갱신해야 합니다.

---

## 🎨 디자인 컨셉

겨울 홋카이도 눈꽃축제 무드 — 후지산 실루엣(SVG, 커버 워터마크) + 은은하게 흩날리는 눈 효과.

- **컬러 팔레트**: 스틸블루(`#7B95AC`) · 아이스블루(`#C5D5E0`) · 다크네이비(`#4A5F73`) · 페리윙클(`#A3AECF`) · 아이스크림(`#F4F7FA`)
- **타이포그래피**:
  - 한글: Noto Serif KR (200~600)
  - 영문 세리프: Cormorant Garamond
- **유리 효과**: `backdrop-filter: blur` + 반투명 흰 배경 + 내부 하이라이트 그림자
- **부드러운 모서리**: 16~32px 라운드, 직선 테두리 없음
- **유기적 구분선**: SVG 꽃잎 흩날림 패턴
- **마이크로 애니메이션**: 페이드인 / 스크롤 등장 / 캐릭터 둥둥 / 예식일 펄스 / 눈송이 낙하(`.petals-overlay`, `prefers-reduced-motion`에서 비활성화)

> 카카오·네이버·토스·구글 캘린더 등 외부 서비스 버튼은 각 브랜드 고유 색상을 그대로 유지합니다(팔레트 변경 대상 아님).

---

## 🗺 지도 & 길찾기

- **임베드**: Google Maps (`output=embed`, 키 불필요)
- **길찾기 모달** 4종 앱 지원, 전부 **좌표가 있으면 좌표 우선, 없으면 주소로 검색**
  - 네이버 지도 (모바일 앱 딥링크는 좌표, 웹 폴백은 주소 검색)
  - 카카오맵 (좌표 있으면 정확한 지점, 없으면 주소 검색)
  - 카카오내비 (앱 딥링크 + fallback, 목적지는 좌표)
  - T맵 (앱 딥링크 + fallback, 목적지는 좌표)
- 화면에 보이는 예식장 "이름"과 길찾기 검색에 쓰이는 "이름"은 분리되어 있습니다 — `venue.name`(화면 표시용)과 `venue.navName`(길찾기 버튼 라벨용, 선택. 비우면 name 사용). 단, 실제 검색·목적지 지정에는 이름이 아니라 **주소/좌표**만 사용됩니다.
- 예식장 본체·추가 장소(주차장 등)마다 `useCoords` 플래그로 "좌표 우선 사용 여부"를 개별 지정 가능 (photo.html 체크박스)
- **주소 → 좌표 변환**: photo.html에서 "🔍 주소로 좌표 찾기" 버튼 → `/api/geocode`(카카오 로컬 주소 검색 API) 로 자동 변환. 카카오 개발자 콘솔에서 사용 중인 앱의 **"카카오맵" 제품을 활성화**하고 `KAKAO_REST_API_KEY` 환경변수를 Vercel에 등록해야 동작합니다.

좌표는 `setting.json`의 `venue.lat / venue.lng`(초기 기본값)를 photo.html에서 저장한 `/api/venue`의 값이 우선 덮어씁니다.

---

## 💸 송금 기능

마음 전하기 카드 클릭 → 모달에서 선택:

| 옵션 | 동작 |
|------|------|
| **토스로 송금** | `supertoss://send` 딥링크 → 미설치 시 카카오페이 → 또 미설치 시 복사 |
| **카카오페이 송금** | `kakaotalk://kakaopay/...` 딥링크 → 미설치 시 토스 → 또 미설치 시 복사 |
| **계좌번호 복사** | clipboard API (실패 시 execCommand 폴백) |

`visibilitychange` / `blur` 이벤트로 앱 실행 여부 자동 감지 → fallback 체인 동작.

---

## 🚀 실행 방법

간단히 정적 화면만 확인할 땐 아래로 충분합니다 (단, `setting.json`을 `fetch`로 불러오므로 **로컬 파일 직접 열기는 CORS 차단**될 수 있습니다).

```bash
# 간이 로컬 서버
python -m http.server 8080
# 또는
npx serve .
```

브라우저에서 `http://localhost:8080` 접속.

> ⚠️ 이 방법으로는 `api/*.js`(Vercel Functions)가 동작하지 않아서, photo.html에서 저장한 예식장·날짜·계좌 등 **KV 데이터는 반영되지 않고 `setting.json` 기본값만** 보입니다. photo.html 관리자 기능(주소로 좌표 찾기, 저장 등)까지 실제로 테스트하려면 아래처럼 Vercel CLI로 띄워야 합니다.

```bash
npm i -g vercel
vercel dev
```

`vercel dev`는 Vercel KV 연동과 `KAKAO_REST_API_KEY` 같은 환경변수도 함께 필요합니다 (Vercel 프로젝트에 이미 연결되어 있다면 `vercel env pull`로 로컬에 받아올 수 있습니다).

---

## 📱 호환성

- 모바일 우선 디자인 (max-width 480px 최적화)
- iOS Safari / Android Chrome / 데스크톱 모두 지원
- `100svh` 사용으로 iOS 주소창 흔들림 방지

---

## 📝 라이선스

개인용 — 자유롭게 수정/사용
