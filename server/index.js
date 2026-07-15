require('dotenv').config();
const express = require('express');
const cors = require('cors');
const retrieveContext = require('./retrieveContext');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.post('/api/ask-concierge', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const relevantFacts = retrieveContext(question);

  let systemPrompt;
  if (relevantFacts.length === 0) {
    systemPrompt = `You are a stadium concierge assistant. No relevant information was found for this question. Tell the user honestly that you don't have that information, in one short sentence. Do not make anything up.`;
  } else {
    const factsText = relevantFacts.map((f) => `- ${f.fact}`).join('\n');
    systemPrompt = `You are a stadium concierge assistant. Answer the user's question using ONLY the facts below. Do not add any information that isn't in these facts. If the facts don't fully answer the question, say what you do know and note what's missing. Be concise and friendly.

Facts:
${factsText}`;
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq error:', errText);
      return res.status(502).json({ error: 'AI service failed' });
    }

    const data = await groqResponse.json();
    const answer = data.choices[0].message.content.trim();

    res.json({
      answer,
      sourcesUsed: relevantFacts.map((f) => f.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Concierge proxy running on http://localhost:${PORT}`);
});