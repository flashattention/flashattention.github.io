# flashattention.github.io

전은배의 포트폴리오 사이트입니다. **https://flashattention.github.io/**

AI 코딩 에이전트와 함께 만든 프로젝트, 일하는 방식, 연구와 이력을 한 페이지에 모았고, 인쇄용 이력서 페이지를 따로 둡니다.

| 주소 | 내용 |
|---|---|
| [`/`](https://flashattention.github.io/) | 포트폴리오. 대표 프로젝트 4개(젤리 게임즈, 젤리 서울 러너, Latent Atlas, AgentLab), AI 에이전트와 일하는 방식, 그 밖의 프로젝트, 이력, 연락처 |
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

## 수치 기준

카드와 이력서의 숫자는 각 프로젝트 저장소와 운영 기록 기준입니다. 젤리 게임즈 규모·커밋 수는 2026-11-12, 드림 러너 플레이 수는 2026-11-08 기준이고, 바뀌면 `index.html`과 `resume/index.html`을 함께 고칩니다.

## 라이선스

학습 글 쪽 레이아웃과 스타일(`_layouts/`, `_includes/`, `_sass/`)은 [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) 테마(MIT, © Michael Rose and contributors)에서 왔으며 [LICENSE](LICENSE)를 따릅니다. 포트폴리오와 이력서의 글과 디자인은 전은배에게 있습니다.
