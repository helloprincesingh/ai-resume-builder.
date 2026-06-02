```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Static frontend files serve
app.use(express.static(path.join(__dirname, '..')));

// Homepage route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Gemini API Route
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, temperature = 0.7 } = req.body;

        const apiKey =
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(401).json({
                error: 'API Key not configured on server.'
            });
        }

        const models = [
            'gemini-2.5-flash',
            'gemini-flash-latest'
        ];

        for (const model of models) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: prompt
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature,
                                maxOutputTokens: 2048
                            }
                        })
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    return res.json(data);
                }
            } catch (err) {
                console.log(err.message);
            }
        }

        return res.json({
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: 'AI service is temporarily busy.'
                            }
                        ]
                    }
                }
            ]
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Server Error'
        });
    }
});

// Export for Vercel
module.exports = app;
```
