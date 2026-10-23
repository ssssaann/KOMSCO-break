# 조폐공사 부수기

오늘도 수고했어. 이제, 부숴볼까?

Three.js로 만든 브라우저 3D 미니어처 파괴 게임입니다. 별도 서버나 로그인 없이 GitHub Pages에서 실행됩니다.

## 실행

Node.js 22.12 이상(권장 24)이 필요합니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. 소스를 파일로 직접 열면 ES 모듈을 실행할 수 없으므로 개발 서버를 이용하세요.

```sh
npm test
npm run build
npm run preview
```

## 게임 방법

- 1–6: 폭탄, 방망이, 레이저, 운석, 지진, 핵폭탄 선택
- 클릭 / 모바일 탭: 공격
- 드래그: 카메라 회전, 스크롤 / 핀치: 확대·축소
- Ctrl/⌘ Z: 최근 행동 되돌리기(최대 30회)
- R: 전부 복구. 복구도 되돌릴 수 있습니다.
- 건물 블록 10점, 나무 블록 3점, 지형 손상 단계당 5점
- 한 번의 공격으로 40블록 이상 파괴하면 25% 보너스
- 같은 자리를 반복 공격하면 최대 지하 12단계까지 굴착됩니다. 폭발 중심이 가장 깊게 파이며 흙·모래·암석 단면이 드러납니다.
- 지반을 파내면 위에 있는 건물도 붕괴합니다. 파편은 파인 바닥까지 떨어집니다.
- 이미 파괴된 블록과 최대 깊이에 도달한 지형에서는 점수를 중복 획득하지 않습니다.
- 최고 기록은 각 브라우저의 localStorage에 저장됩니다. 공유 순위/서버 저장은 없습니다.

무기는 각기 다른 파괴 범위, 지형 손상, 애니메이션과 합성 음향을 갖습니다. 하부 블록이 제거되면 같은 기둥의 상부 블록도 붕괴합니다. 잔해에는 중력과 간단한 바닥 반발을 적용합니다. 구조공학/강체 물리를 시뮬레이션하지는 않습니다. 공격 횟수나 대기 시간 제한 없이 자유롭게 플레이할 수 있습니다.

## GitHub Pages 배포

저장소: https://github.com/ssssaann/KOMSCO-break

1. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
2. `main` 브랜치에 코드를 올리면 포함된 `.github/workflows/pages.yml`이 테스트·빌드 후 배포합니다.
3. Actions 탭에서 초록색 완료 표시를 확인합니다.
4. 공유 주소: **https://ssssaann.github.io/KOMSCO-break/**

설정에 관리자 권한이 필요합니다. GitHub Pages의 일반적인 공개 배포는 링크를 아는 회사 외부 사람도 열 수 있습니다.

```sh
git add .
git commit -m "Build 3D campus destruction game"
git push -u origin main
```

Vite의 상대 경로 빌드(`--base=./`)를 사용하므로 저장소 이름이 바뀌어도 에셋 경로가 유지됩니다. 3D 엔진은 빌드 파일에 포함되며 외부 지도 API 키가 필요하지 않습니다. Google Fonts가 차단되면 시스템 글꼴을 사용합니다.

공식 배포 가이드: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 캠퍼스 수정

`src/campus.js`의 `CAMPUS.buildings`에서 이름, 위치(x/z), 폭(width), 깊이(depth), 높이(floors), 벽/지붕 색상을 변경하세요. 좌표는 실제 측량값이 아닌 게임 단위입니다. 기본 맵은 **대전광역시 유성구 과학로 80-67 본사의 공개 외관 사진을 참고한 창작 미니어처**이며 실제 배치·높이·면적을 정확하게 재현하지 않습니다. Google 지도나 항공사진을 추출·포함하지 않습니다. 본관, 양 날개, 기술연구원, 별관, 박물관, 식당의 배치는 게임용입니다.

외관 참고: https://www.kukinews.com/article/view/kuk202202210102

## 파일 구성

- `src/campus.js`: 건물·나무·지형과 무기 설정
- `src/game.js`: 파괴·지지 상실 붕괴·점수·복구 기록
- `src/terrain.js`: 굴착 깊이, 지표 높이, 지층 단면 설정
- `src/main.js`: 3D 렌더링·입력·파편·무기 효과·음향
- `src/style.css`: PC/모바일 화면과 접근성 설정
- `test/game.test.js`: 무기별 파괴, 중복 점수 방지, 지형 손상, 복구 검증

비공식 팬 게임입니다. 실제 기관의 공식 서비스나 실제 파괴 행위와 무관합니다. 지도·사진을 게임 에셋으로 사용하지 않으며 시각 요소는 코드로 생성합니다.
