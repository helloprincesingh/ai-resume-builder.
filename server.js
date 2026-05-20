require('dotenv').config();
const express = require('express');
const cors = require('cors');
// fetch is built-in in Node v18+ — no import needed

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Gemini API Proxy Endpoint
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, temperature = 0.7 } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key not configured on server.' });
        }

        // Try these models in order (verified available names)
        const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite', 'gemini-pro-latest', 'gemini-3-flash-preview'];
        let lastError = null;

        for (const model of models) {
            try {
                console.log(`🚀 Attempting Gemini request with model: ${model}`);
                
                // Retry logic for 429 within the same model
                let attempts = 0;
                while (attempts < 2) {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature }
                            })
                        }
                    );

                    const data = await response.json();

                    if (response.ok) {
                        console.log(`✅ Success with model: ${model}`);
                        return res.json(data);
                    }

                    if (response.status === 429) {
                        attempts++;
                        console.warn(`🛑 Rate limit exceeded (429) for ${model}. Retrying in 2s... (Attempt ${attempts}/2)`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue; // Try again with the same model
                    }

                    console.warn(`⚠️ Model ${model} failed: ${response.status} - ${data.error?.message || 'Unknown error'}`);
                    lastError = data;
                    break; // Try next model
                }
            } catch (err) {
                console.error(`🔥 Fetch error with model ${model}:`, err.message);
                lastError = { error: { message: err.message } };
            }
        }

        // If all models failed
        const status = lastError?.error?.code || 500;
        res.status(status).json(lastError || { error: 'All models failed to respond.' });
    } catch (error) {
        console.error('🔥 Global Server Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
