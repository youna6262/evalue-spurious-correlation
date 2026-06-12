const TEACHER_CODE = process.env.TEACHER_CODE || "2026";
const SHEETS_WEBAPP_URL = process.env.GOOGLE_SHEETS_WEBAPP_URL || "";
const SHEETS_SECRET = process.env.GOOGLE_SHEETS_SECRET || TEACHER_CODE;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function normalizePayload(body) {
  const checklist = Array.isArray(body.checklist) ? body.checklist : [];
  return {
    studentName: String(body.studentName || "").trim().slice(0, 40),
    firstAnswer: String(body.firstAnswer || "").slice(0, 8),
    firstReason: String(body.firstReason || "").trim().slice(0, 500),
    finalAnswer: String(body.finalAnswer || "").slice(0, 8),
    changed: Boolean(body.changed),
    checklist: [Boolean(checklist[0]), Boolean(checklist[1]), Boolean(checklist[2])],
    summary: String(body.summary || "").trim().slice(0, 500),
    completedStep: String(body.completedStep || "완료").slice(0, 20),
    browserTime: String(body.browserTime || "").slice(0, 80),
    userAgent: String(body.userAgent || "").slice(0, 300),
  };
}

async function relayToSheets(action, payload) {
  if (!SHEETS_WEBAPP_URL) {
    const err = new Error("Google Sheets 웹앱 URL 설정이 필요해요.");
    err.statusCode = 503;
    throw err;
  }
  const response = await fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: JSON.stringify({ action, secret: SHEETS_SECRET, payload }),
  });
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, message: text || "시트 응답을 읽지 못했어요." };
  }
  if (!response.ok || !data.ok) {
    const err = new Error(data.message || "Google Sheets 저장소와 연결하지 못했어요.");
    err.statusCode = response.status || 502;
    throw err;
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const payload = normalizePayload(req.body || {});
      if (!payload.studentName) return send(res, 400, { ok: false, message: "학생 번호 또는 닉네임이 필요해요." });
      if (!payload.summary) return send(res, 400, { ok: false, message: "한 문장 정리가 필요해요." });
      const data = await relayToSheets("submit", payload);
      return send(res, 200, { ok: true, id: data.id || null });
    } catch (err) {
      return send(res, err.statusCode || 500, { ok: false, message: err.message || "응답 저장에 실패했어요." });
    }
  }

  if (req.method === "GET") {
    if (String(req.query.code || "") !== TEACHER_CODE) {
      return send(res, 401, { ok: false, message: "교사용 입장 코드가 필요해요." });
    }
    try {
      const data = await relayToSheets("list", {});
      return send(res, 200, { ok: true, responses: data.responses || [] });
    } catch (err) {
      return send(res, err.statusCode || 500, { ok: false, message: err.message || "응답 보드 불러오기에 실패했어요." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return send(res, 405, { ok: false, message: "지원하지 않는 요청이에요." });
};
