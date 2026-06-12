const SHEET_NAME = '응답';
const HEADERS = [
  '응답ID',
  '제출시각',
  '학생번호/닉네임',
  '처음선택',
  '처음이유',
  '최종선택',
  '생각변화',
  '숨은원인체크',
  '힘체크',
  '튼튼함체크',
  '한문장정리',
  '완료단계',
  '브라우저시간',
  '기기정보',
];

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty('EVAL_SHEETS_SECRET') || '2026';
}

function assertSecret_(secret) {
  if (String(secret || '') !== getSecret_()) throw new Error('인증 정보가 맞지 않아요.');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeader = HEADERS.some((h, i) => current[i] !== h);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowFromPayload_(payload) {
  const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
  const id = Utilities.getUuid();
  const submittedAt = new Date();
  return [
    id,
    submittedAt,
    String(payload.studentName || ''),
    String(payload.firstAnswer || ''),
    String(payload.firstReason || ''),
    String(payload.finalAnswer || ''),
    payload.changed ? '바뀜' : '유지',
    checklist[0] ? 'TRUE' : 'FALSE',
    checklist[1] ? 'TRUE' : 'FALSE',
    checklist[2] ? 'TRUE' : 'FALSE',
    String(payload.summary || ''),
    String(payload.completedStep || '완료'),
    String(payload.browserTime || ''),
    String(payload.userAgent || ''),
  ];
}

function rowToObject_(row) {
  return {
    id: row[0],
    submittedAt: row[1] instanceof Date ? row[1].toISOString() : row[1],
    studentName: row[2],
    firstAnswer: row[3],
    firstReason: row[4],
    finalAnswer: row[5],
    changedText: row[6],
    changed: row[6],
    checkHiddenCause: row[7],
    checkStrength: row[8],
    checkRobust: row[9],
    summary: row[10],
    completedStep: row[11],
    browserTime: row[12],
    userAgent: row[13],
  };
}

function handleRequest_(data) {
  assertSecret_(data.secret);
  const action = data.action || 'submit';
  const sheet = getSheet_();
  if (action === 'submit') {
    const row = rowFromPayload_(data.payload || {});
    sheet.appendRow(row);
    return { ok: true, id: row[0] };
  }
  if (action === 'list') {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: true, responses: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    return { ok: true, responses: rows.map(rowToObject_) };
  }
  throw new Error('지원하지 않는 요청이에요.');
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    return jsonResponse_(handleRequest_(data));
  } catch (err) {
    return jsonResponse_({ ok: false, message: err.message || '요청 처리에 실패했어요.' });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'Evalue 응답 수집 웹앱이 준비됐어요.' });
}
