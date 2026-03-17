# Aria AI Chatbot

Full-stack AI chatbot powered by Claude (Anthropic). Support streaming, dark mode premium UI, dan bisa jawab semua topik.

## Struktur File

```
aria-chatbot/
├── server.js          ← Backend Express (API proxy ke Anthropic)
├── package.json
├── .env.example       ← Template environment variables
├── .env               ← Buat sendiri, jangan di-commit!
└── public/
    └── index.html     ← Frontend (landing page + chat widget)
```

## Setup & Jalanin Lokal

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env
```bash
cp .env.example .env
```
Lalu edit `.env` dan isi API key lo:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

Dapetin API key di: https://console.anthropic.com/

### 3. Jalanin server
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

### 4. Buka di browser
```
http://localhost:3000
```

---

## Deploy ke Internet

### Railway (Recommended — Gratis)
1. Push code ke GitHub
2. Buka https://railway.app → New Project → Deploy from GitHub
3. Tambah environment variable: `ANTHROPIC_API_KEY`
4. Done! Dapet URL otomatis

### Render (Gratis)
1. Push ke GitHub
2. https://render.com → New Web Service
3. Build command: `npm install`
4. Start command: `npm start`
5. Tambah env var `ANTHROPIC_API_KEY`

### VPS (Ubuntu)
```bash
git clone <repo-lo>
cd aria-chatbot
npm install
# Install PM2
npm install -g pm2
# Jalanin
pm2 start server.js --name aria
pm2 save
pm2 startup
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/chat` | Chat standar (full response) |
| POST | `/api/chat/stream` | Chat dengan streaming SSE |
| GET | `/api/health` | Cek status server & API key |

### Contoh request `/api/chat`
```json
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "Halo Aria!" }
  ]
}
```

### Response
```json
{
  "reply": "Halo! Gua Aria...",
  "usage": { "input_tokens": 42, "output_tokens": 80 }
}
```

---

## Kustomisasi

### Ganti nama & persona AI
Edit variabel `SYSTEM_PROMPT` di `server.js`

### Switch streaming on/off
Di `public/index.html`, cari:
```js
const USE_STREAM = true; // ganti false kalau mau non-streaming
```

### Ganti model
Di `server.js`, cari `claude-sonnet-4-20250514` dan ganti sesuai kebutuhan:
- `claude-opus-4-20250514` — paling pintar, lebih lambat
- `claude-sonnet-4-20250514` — balance (default)
- `claude-haiku-4-5-20251001` — paling cepat & murah
