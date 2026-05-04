// ═══════════════════════════════════════════════════════════
// Google Apps Script — Brief формасы үшін
// Жаңа бағандармен: Status, ImageURL, TelegramSent, GeneratedAt
// ═══════════════════════════════════════════════════════════

const SHEET_NAME = 'Sheet1'; // керек болса өзгерт

// ───────── GET — деректерді оқу (сайт үшін) ─────────
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const result = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    // Sizes-ті массивке айналдыру (сайт үшін)
    if (obj.Sizes && typeof obj.Sizes === 'string') {
      obj.sizes = obj.Sizes.split(',').map(s => s.trim());
    }
    // Сайт күтетін key-лерге map ету
    obj.id = obj.ID;
    obj.dealer = obj.Dealer;
    obj.email = obj.Email;
    obj.phone = obj.Phone;
    obj.appDate = obj.AppDate;
    obj.format = obj.Format;
    obj.carModel = obj.CarModel;
    obj.headline = obj.Headline;
    obj.cta = obj.CTA;
    obj.subtext = obj.Subtext;
    obj.disclaimer = obj.Disclaimer;
    obj.visual = obj.Visual;
    obj.assignee = obj.Assignee || '';
    obj.submittedAt = obj.SubmittedAt;
    return obj;
  }).reverse(); // ең жаңасы алдында

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ───────── POST — заявка қабылдау немесе assignee жаңарту ─────────
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const params = e.parameter;
  const action = params.action || 'submit';

  // ── Assignee жаңарту (админ) ──
  if (action === 'assign') {
    const id = params.id;
    const assignee = params.assignee;
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('ID');
    const assigneeCol = headers.indexOf('Assignee');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === id) {
        sheet.getRange(i + 1, assigneeCol + 1).setValue(assignee);
        return ContentService.createTextOutput(JSON.stringify({ ok: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Жаңа заявка ──
  // Бағандарды бірінші рет жасау
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'ID', 'SubmittedAt', 'Dealer', 'Email', 'Phone', 'AppDate',
      'Format', 'Sizes', 'CarModel', 'Headline', 'CTA',
      'Subtext', 'Disclaimer', 'Visual', 'Assignee',
      // ↓↓↓ АВТОМАТИЗАЦИЯ ҮШІН ЖАҢА БАҒАНДАР ↓↓↓
      'Status', 'ImageURL', 'TelegramSent', 'GeneratedAt', 'ErrorMsg'
    ]);
  }

  const id = 'BRF-' + Date.now().toString(36).toUpperCase().slice(-6);
  const now = new Date().toISOString();

  sheet.appendRow([
    id,
    now,
    params.dealer || '',
    params.email || '',
    params.phone || '',
    params.appDate || '',
    params.format || '',
    params.size || '', // sizes (массив string-ке айналдырылған)
    params.carModel || '',
    params.headline || '',
    params.cta || '',
    params.subtext || '',
    params.disclaimer || '',
    params.visual || '',
    '', // Assignee — бос
    'new', // ← Status: n8n осыны "processing" → "sent" деп ауыстырады
    '', // ImageURL — бос
    'FALSE', // TelegramSent
    '', // GeneratedAt
    '' // ErrorMsg
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id }))
    .setMimeType(ContentService.MimeType.JSON);
}
