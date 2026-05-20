require('dotenv').config();
const express = require('express');
const cors = require('cors');
// fetch is built-in in Node v18+ — no import needed

const app = express();
const BASE_PORT = parseInt(process.env.PORT, 10) || 3000;
let currentPort = BASE_PORT;
const GEMINI_API_VERSION = 'v1beta';

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Gemini API Proxy Endpoint
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, temperature = 0.7 } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key not configured on server.' });
        }

        // Try these models in order (verified available names)
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
        let lastError = null;

        for (const model of models) {
            try {
                console.log(`🚀 Attempting Gemini request with model: ${model}`);
                
                // Retry logic for 429 within the same model
                let attempts = 0;
                while (attempts < 2) {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature }
                            })
                        }
                    );

                    // Safely parse JSON — empty body from legacy endpoints causes an unhandled crash
                    const rawText = await response.text();
                    let data = {};
                    try { data = rawText ? JSON.parse(rawText) : {}; } catch (_) { data = { error: { message: `Non-JSON response from model ${model}` } }; }

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

                    if (response.status === 403) {
                        console.warn(`🚫 Gemini permission denied for ${model}: ${data.error?.message || 'Forbidden'}`);
                    } else if (response.status === 404) {
                        console.warn(`⚠️ Gemini model not found or unsupported for ${model}: ${data.error?.message || 'Not found'}`);
                    } else {
                        console.warn(`⚠️ Model ${model} failed: ${response.status} - ${data.error?.message || 'Unknown error'}`);
                    }
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

const startServer = () => {
    const server = app.listen(currentPort, () => {
        console.log(`✅ Server running on http://localhost:${currentPort}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ Port ${currentPort} is already in use.`);
            currentPort += 1;
            if (currentPort - BASE_PORT > 10) {
                console.error('❌ Unable to find a free port after 10 attempts.');
                process.exit(1);
            }
            console.log(`🔁 Trying next port: ${currentPort}`);
            startServer();
        } else {
            console.error('🔥 Server error:', err);
            process.exit(1);
        }
    });
};

startServer();
