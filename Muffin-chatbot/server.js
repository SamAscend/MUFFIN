require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Kamu adalah Aria, asisten AI yang sangat cerdas, ramah, dan serba bisa. Kamu menjawab pertanyaan tentang SEMUA topik tanpa terkecuali — teknologi, sains, sejarah, filsafat, hukum, kedokteran, bisnis, coding, bahasa, budaya, olahraga, seni, matematika, psikologi, ekonomi, politik, lingkungan, dan apapun lainnya.

Gaya komunikasimu:
- Santai, natural, dan hangat — seperti teman pintar yang enak diajak ngobrol
- Jawaban langsung ke poin, tidak bertele-tele
- Bahasa Indonesia yang enak dibaca, boleh campur Inggris kalau natural
- Gunakan contoh konkret dan analogi untuk hal yang kompleks
- Untuk jawaban panjang, beri struktur yang jelas (nomor, poin, pemisah)

Yang TIDAK boleh kamu lakukan (hanya ini):
1. Menjawab permintaan konten seksual, erotis, atau pornografi
2. Membuat konten yang melibatkan eksploitasi anak
3. Membuat konten hate speech yang menyerang kelompok tertentu

Semua topik lain TETAP boleh dijawab secara informatif dan berimbang.`;

// ── POST /api/chat ─────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi di .env' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Groq API error.' });

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Respons API tidak valid.' });
    return res.json({ reply, usage: data.usage });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/chat/stream ──────────────────
app.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      res.write(`data: ${JSON.stringify({ error: err?.error?.message || 'API error' })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const event = JSON.parse(raw);
          const text = event?.choices?.[0]?.delta?.content;
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch (_) {}
      }
    }
    res.end();

  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: 'Streaming gagal.' })}\n\n`);
    res.end();
  }
});

// ── Health check ───────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', provider: 'Groq', hasApiKey: !!process.env.GROQ_API_KEY });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🤖 Aria Chatbot running at http://localhost:${PORT}`);
  console.log(`📋 Groq API Key: ${process.env.GROQ_API_KEY ? '✅ OK' : '❌ Missing'}\n`);
});
