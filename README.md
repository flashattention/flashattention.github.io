# flashattention.github.io

전은배의 포트폴리오 사이트입니다. **https://flashattention.github.io/**

AI 코딩 에이전트와 함께 만든 프로젝트, 일하는 방식, 연구와 이력을 한 페이지에 모았고, 인쇄용 이력서 페이지를 따로 둡니다.

| 주소 | 내용 |
|---|---|
| [`/`](https://flashattention.github.io/) | 포트폴리오. 대표 프로젝트 4개(젤리 게임즈, AgentLab, 젤리 서울 러너, Latent Atlas), AI 에이전트와 일하는 방식, 그 밖의 프로젝트, 이력, 연락처 |
| [`/resume/`](https://flashattention.github.io/resume/) | A4 2쪽 이력서. 브라우저의 인쇄 버튼으로 PDF 저장 |
| `/about/` | 포트폴리오의 이력 섹션(`/#about`)으로 이동 |
| `/categories/…`, 각 글 주소 | 예전에 쓴 머신러닝·NLP 학습 글 (`_posts/`) |

## 구조

```
index.html               포트폴리오 첫 화면 (Jekyll 레이아웃 없이 그대로 배포)
assets/portfolio/
  site.css               포트폴리오 스타일
  site.js                프로젝트 카드의 캔버스 장면과 스크롤 연동
  og.png                 링크 미리보기 이미지 (1200×630)
resume/index.html        인쇄용 이력서 (레이아웃 없이 그대로 배포)
_pages/about.md          /about/ → /#about 이동
_posts/, _pages/categories/   예전 학습 글과 카테고리 페이지 (Minimal Mistakes 레이아웃)
_config.yml, _data/navigation.yml   학습 글 쪽 사이트 설정과 메뉴
```

포트폴리오와 이력서는 외부 프레임워크 없이 HTML·CSS·JavaScript 파일 하나씩으로 되어 있습니다. 폰트는 Google Fonts(Hahmlet, Jua, JetBrains Mono)와 jsDelivr(Pretendard)에서 불러옵니다.

### 프로젝트 카드 동작

- 넓은 화면(가로 901px 이상, 세로 700px 이상)에서는 카드가 화면에 붙어 있는 동안 스크롤이 왼쪽 캔버스 장면을 움직입니다.
- 카드 글이 화면 높이를 넘으면 `site.js`의 `fit()`이 먼저 글을 촘촘하게 줄이고(`.dense`), 그래도 넘치면 그 카드만 고정을 풀어(`.unpin`) 글 길이대로 늘립니다. 카드 안에 스크롤이 생기지 않게 하기 위해서입니다.
- 좁은 화면에서는 카드가 위아래로 쌓입니다.
- 움직임 줄이기 설정을 켠 브라우저에서는 애니메이션 없이 완성된 장면 한 장만 보여 줍니다.

## 로컬에서 보기

포트폴리오와 이력서만 볼 때는 정적 서버면 됩니다.

```bash
python3 -m http.server 8000
# http://localhost:8000/ , http://localhost:8000/resume/
```

학습 글까지 Jekyll로 빌드해 보려면 Ruby와 Bundler가 필요합니다.

```bash
bundle install
bundle exec jekyll serve
```

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 Jekyll로 빌드해 배포합니다. 보통 1~2분 걸립니다.

## 수치 기준 (매일 아침 자동 갱신)

첫 화면과 카드, 이력서의 숫자 중 저장소에서 다시 셀 수 있는 것은 `.github/workflows/stats.yml`이 매일 아침 8시(한국 시간)에 `scripts/update-stats.mjs`로 다시 계산합니다. 값이 바뀌었을 때만 `github-actions[bot]`이 커밋하고, 그 푸시로 GitHub Pages가 다시 배포됩니다. 계산한 값은 [`assets/portfolio/stats.json`](assets/portfolio/stats.json)에도 남깁니다.

HTML에서는 `<span data-stat="키">값</span>`의 내용과, `data-tpl="…{키}…"`가 붙은 `<meta>`의 `content`만 바뀝니다. 새 숫자를 자동으로 바꾸려면 같은 형식으로 감싸고 스크립트에 키를 추가합니다.

| 키 | 출처 |
|---|---|
| `jelly.games` | jelly-city `public/index.html`의 게임 카드 수 (서울 산책은 드림 러너의 맵이라 제외) |
| `jelly.days` | jelly-city 첫 커밋 날짜부터 마지막 커밋 날짜까지 일수 (양 끝 포함, 한국 시간) |
| `jelly.commits`, `jelly.agent`, `jelly.asof` | jelly-city 전체 커밋 수, 그중 `Co-Authored-By: Claude` 트레일러가 있는 커밋 수, 마지막 커밋 날짜 |
| `jelly.lines` | jelly-city의 `.js`·`.mjs`·`.cjs` 줄 수, 천 단위 내림 |
| `jelly.plays`, `jelly.hours`, `jelly.lb*`, `jelly.mdate` | jelly-city `docs/metrics.md` (운영 서버에서 `tools/metrics.mjs`로 뽑아 커밋할 때 바뀝니다) |
| `seoul.gu`, `seoul.tiles` | `public/dream-runner/hangang/seoul.json`의 구 수, `seoul/index.json`의 칸 수 |
| `seoul.buildings`, `seoul.shops` | 칸 지도 파일에서 서울 경계 안 건물 수와 그 건물에 연결된 가게 수, 만 단위 내림 |
| `agentlab.*` | agent-lab `frontend/content/learn`의 모듈·강의 수, `patterns.ts`의 패턴 수 |
| `atlas.*` | latent-atlas `src/registry.js`의 장·개념 수(`z`로 시작하는 장은 부록), `content/terms`의 언어 수 |

저장소에서 셀 수 없는 숫자(데이터 9종·실시간 API 4종, 지표를 보고 결정한 당시의 숫자 71%·8% 같은 과거 기록, 논문·학점 등)는 손으로 고칩니다. 스케줄 실행은 GitHub 사정에 따라 몇 분에서 수십 분 늦을 수 있고, Actions 탭에서 **사이트 수치 갱신 → Run workflow**로 바로 돌릴 수 있습니다.

## 이력서 PDF 메일 (매일 아침)

같은 워크플로가 수치를 갱신한 뒤 `scripts/build-cv.mjs`로 `scripts/cv/template.html`에 `stats.json` 값을 넣어 이력서 PDF를 만들고, `scripts/send-cv-mail.py`로 메일에 첨부해 보냅니다. PDF는 러너 임시 폴더에서만 만들고 저장소에는 올리지 않습니다(`.gitignore`에 `*.pdf`).

- 템플릿의 숫자도 사이트와 같은 `<span data-stat="키">` 형식입니다. 문구를 고칠 때는 템플릿만 고치면 됩니다.
- 내용은 위에서 아래로 흐르고 쪽은 Chrome이 나눕니다. 평소 A4 2쪽이고, 2쪽을 넘으면 경고, 3쪽을 넘거나 웹 글꼴을 못 불러오면 실패합니다.
- 메일은 저장소 **Settings → Secrets and variables → Actions**의 `MAIL_USERNAME`(보내는 Gmail), `MAIL_PASSWORD`(Gmail 앱 비밀번호), `MAIL_TO`(받는 주소, 비우면 보내는 주소)로 보냅니다. Secret이 없으면 메일 단계만 건너뜁니다.
- 로컬에서 만들어 보기: `npm ci --prefix scripts && CHROME_PATH=<chrome 경로> node scripts/build-cv.mjs <출력 폴더>`

## 라이선스

학습 글 쪽 레이아웃과 스타일(`_layouts/`, `_includes/`, `_sass/`)은 [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) 테마(MIT, © Michael Rose and contributors)에서 왔으며 [LICENSE](LICENSE)를 따릅니다. 포트폴리오와 이력서의 글과 디자인은 전은배에게 있습니다.
