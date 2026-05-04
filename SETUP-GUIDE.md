# 🚀 Brief → Freepik → Telegram автоматизациясы

Толық pipeline: Сайттан жіберілген бриф автоматты түрде Freepik AI-да суретке айналып, Telegram-ға жіберіледі.

---

## 📁 Осы папкадағы файлдар

| Файл | Не үшін |
|---|---|
| `brief.html` | Сайтыңның негізгі коды (бұрынғы) |
| `google-apps-script.js` | Sheets-ке жаңа бағандар қосады |
| `n8n-workflow-freepik-telegram.json` | n8n workflow-ы |

---

## 1️⃣ Google Apps Script-ті жаңарту

1. Қазіргі Apps Script-ті аш: **script.google.com**
2. `google-apps-script.js` файлындағы кодты толығымен көшіріп, ескі кодты ауыстыр
3. **Deploy → Manage deployments → Edit (қарындаш)** → **New version** → **Deploy**
4. Sheets-ке кіріп жаңа бағандар автоматты қосылғанын тексер: `Status`, `ImageURL`, `TelegramSent`, `GeneratedAt`, `ErrorMsg`

> 💡 Егер бағандар автоматты қосылмаса, оларды қолмен бас жолға жаз

---

## 2️⃣ Freepik API кілтін алу

1. **freepik.com/api** парағына кір
2. Подпискаң бар болғандықтан → **Dashboard → API Keys → Create Key**
3. Кілтті көшіріп ал (мысалы: `FPSX...`)

> ⚠️ Freepik Mystic AI үшін бөлек подписка керек болуы мүмкін — API парағында тексер

---

## 3️⃣ Telegram бот жасау

1. Telegram-да **@BotFather**-ге бар
2. `/newbot` → атау бер → username бер
3. Алған **bot token**-ды сақтап ал (мысалы: `7234567890:AAH...`)
4. Енді **Chat ID** табу керек:
   - Жаңа ботқа `/start` басыңыз (немесе оны топқа қосыңыз)
   - Браузерде ашыңыз: `https://api.telegram.org/bot<СІЗДІҢ_ТОКЕН>/getUpdates`
   - JSON-нан `"chat":{"id":...}` мәнін алыңыз (топ үшін теріс сан болуы мүмкін, мысалы `-1001234567890`)

---

## 4️⃣ n8n орнату

### Cloud нұсқасы (оңай):
1. **n8n.cloud** — тіркел (free trial бар)
2. Workflow → **Import from file** → `n8n-workflow-freepik-telegram.json` файлын жүкте

### Self-hosted (тегін):
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```
Браузерде: `http://localhost:5678`

---

## 5️⃣ n8n-де credentials қосу

Workflow импортталған соң, мынадай 3 credential жасау керек:

### A) Google Sheets credential
1. **Settings → Credentials → New** → "Google Sheets OAuth2 API"
2. Google аккаунтыңмен қосыл
3. Sheets node-тарында осы credential-ді таңда

### B) Freepik HTTP Header Auth
1. **New credential → Header Auth**
2. **Name:** `x-freepik-api-key`
3. **Value:** Freepik кілтің (`FPSX...`)
4. Freepik node-тарында осыны таңда

### C) Telegram credential
1. **New → Telegram API**
2. **Access Token:** BotFather берген токен
3. Telegram node-та осыны таңда

---

## 6️⃣ Workflow ішіндегі айнымалыларды толтыру

**1. Sheets node-тарында:**
- `СІЗДІҢ_SHEET_ID` орнына өз Google Sheet ID-ңды қой
  (URL-ден көрінеді: `docs.google.com/spreadsheets/d/[ОСЫ ЖЕРДЕ ID]/edit`)
- `Sheet1` дұрыс парақ атауы болса — қалдыр, болмаса өзгерт

**2. Telegram node-та:**
- `СІЗДІҢ_TELEGRAM_CHAT_ID` орнына 4-қадамда тапқан Chat ID-ді қой
- **Operation:** `Send Photo` деп таңдалғанын тексер
- **Photo input field type:** `URL`
- **Photo:** `={{ $json.data.generated[0] }}`

---

## 7️⃣ Telegram node-ты қолмен қалпына келтіру

Импорт кезінде Telegram node-тың параметрлері кейде жоғалады. Мынаны қос:
- **Resource:** `Message`
- **Operation:** `Send Photo`
- **Chat ID:** өз ID-ң
- **Photo:** `={{ $json.data.generated[0] }}` (Freepik қайтарған URL)
- **Additional Fields → Caption:** `={{ $('Промпт құрастыру').item.json.captionForTelegram }}`
- **Parse Mode:** `Markdown`

---

## 8️⃣ Тексеру

1. n8n-де workflow-ты **Active** қыл (жоғарғы оң жақта toggle)
2. Сайтыңнан жаңа бриф жібер
3. 2-3 минут күт (cron 2 минут сайын тексереді)
4. Telegram-ға сурет + caption келуі керек
5. Sheets-те `Status` "sent" болады

---

## ⚠️ Жиі кездесетін мәселелер

**1. "Workflow ничего не делает"**
- Workflow Active ма? Жоғарғы оң жақтағы toggle тексер
- Sheets-те `Status="new"` жолдар бар ма?

**2. "Freepik 401 Unauthorized"**
- API кілт дұрыс па? Header атауы дәл `x-freepik-api-key` болуы керек

**3. "Telegram 400 Bad Request"**
- Chat ID дұрыс па? Топ үшін `-100...` префиксі болуы керек
- Бот сол топта ма? Топта оның құқықтары бар ма?

**4. "Сурет жасалмайды, бос қайтарады"**
- Промпт өте қысқа немесе бұзық па? "Промпт құрастыру" node-тың output-ын тексер
- Freepik подпискаң Mystic-ке кіреді ме?

**5. "Бір заявка қайта-қайта жіберіле береді"**
- "Sheet-ті жаңарту" node жұмыс істеп жатыр ма? Status "sent" болуы керек

---

## 🎨 Промптты жақсарту (қалаған кезде)

`Промпт құрастыру` node-тағы JS кодты ашсаң, prompt-ты өз стиліңе бейімдей аласың:

```javascript
// Мысалы, бренд стилін қосу
const prompt = `Cinematic luxury car advertisement for ${car}. 
Brand identity: bold, modern, premium feel. 
${visualNotes}. 
Lighting: dramatic studio lighting with rim light. 
Background: minimalist gradient or urban environment.
Composition: 1/3 rule, car at golden ratio position.
Quality: 8K, hyperrealistic, magazine cover quality.
Negative: no text, no logos, no watermarks, no people.`;
```

---

## 💰 Шамамен шығын

| Қызмет | Айлық |
|---|---|
| Freepik AI (бар подписка) | $0 (қолда) |
| n8n Cloud (Starter) | $20 |
| n8n Self-hosted | $0 |
| Telegram Bot | $0 |
| Google Sheets | $0 |

**Барлығы:** $0–$20/ай (n8n-ді өз серверіңде өткізсең — тегін)

---

## 🔥 Қосымша идеялар (кейін)

1. **GPT-4 қосу** → промптты автоматты түрде жақсарту
2. **Photoshop API** → жасалған суретке текст автоматты қою
3. **Approval flow** → Telegram-да "✅ Бекіту / ❌ Қайта жасау" батырмалары
4. **Multiple variants** → бір брифке 3 нұсқа жасап, ең жақсысын таңдау
5. **WhatsApp** → Telegram орнына/қосымша WhatsApp-қа жіберу
