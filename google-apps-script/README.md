# Evalue Google Sheets 연결

학생 응답 저장소:

https://docs.google.com/spreadsheets/d/1l_287_WHbUH0dhcWfAk-QGObn_9upGoc4IbOOFvcsDw

## Apps Script 배포

1. 위 Google Sheets를 엽니다.
2. `확장 프로그램` -> `Apps Script`를 엽니다.
3. `evalue-responses.gs` 내용을 붙여넣습니다.
4. `프로젝트 설정` -> `스크립트 속성`에 값을 추가합니다.
   - 속성: `EVAL_SHEETS_SECRET`
   - 값: 교사용 코드와 같은 값 또는 별도 비밀값
5. `배포` -> `새 배포` -> 유형 `웹 앱`
   - 실행 사용자: `나`
   - 액세스 권한: `모든 사용자`
6. 웹 앱 URL을 복사해 Vercel 환경변수로 설정합니다.

## Vercel 환경변수

- `GOOGLE_SHEETS_WEBAPP_URL`: Apps Script 웹 앱 URL
- `GOOGLE_SHEETS_SECRET`: Apps Script 속성 `EVAL_SHEETS_SECRET` 값
- `TEACHER_CODE`: 교사용 입장 코드. 기본값은 `2026`
