const http = require('http');

const payload = JSON.stringify({ prompt: 'Say hello in one word.', temperature: 0.3 });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/gemini',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            const errMsg = parsed?.error?.message;
            if (text) console.log('✅ AI Response:', text);
            else if (errMsg) console.log('⚠️  API Error:', errMsg);
            else console.log('Raw:', data.substring(0, 300));
        } catch(e) {
            console.log('Raw:', data.substring(0, 300));
        }
    });
});

req.on('error', e => console.error('❌ Request failed:', e.message));
req.write(payload);
req.end();
