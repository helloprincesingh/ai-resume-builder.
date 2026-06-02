require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const path = require('path');
const BASE_PORT = parseInt(process.env.PORT, 10) || 3000;
let currentPort = BASE_PORT;

app.use(cors());
app.use(express.json());
app.use(express.static('./'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Gemini API Proxy Endpoint
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, temperature = 0.7 } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key not configured on server.' });
        }

        // Stable models
        const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
        let lastError = null;

        for (const model of models) {
            try {
                console.log(`🚀 Attempting Gemini request with model: ${model}`);
                let attempts = 0;
                while (attempts < 4) {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: {
                                    temperature,
                                    maxOutputTokens: 2048
                                }
                            })
                        }
                    );

                    const rawText = await response.text();
                    let data = {};
                    try {
                        data = rawText ? JSON.parse(rawText) : {};
                    } catch (e) {
                        data = { error: { message: `Non-JSON response from ${model}` } };
                    }

                    // SUCCESS
                    if (response.ok) {
                        console.log(`✅ Success with model: ${model}`);
                        return res.json(data);
                    }

                    // RATE LIMIT
                    if (response.status === 429) {
                        attempts++;
                        console.warn(`🛑 Rate limit exceeded for ${model}. Retrying... (${attempts}/4)`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }

                    console.warn(`⚠️ ${model} failed: ${response.status}`);
                    lastError = data;
                    break;
                }
            } catch (err) {
                console.error(`🔥 Fetch error with model ${model}:`, err.message);
                lastError = { error: { message: err.message } };
            }
        }

        // Fallback response instead of crashing
        return res.json({
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: "AI service is temporarily busy. Please try again in a few seconds."
                            }
                        ]
                    }
                }
            ]
        });

    } catch (error) {
        console.error('🔥 Global Server Error:', error);
        return res.json({
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: "Temporary AI server issue. Please try again."
                            }
                        ]
                    }
                }
            ]
        });
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