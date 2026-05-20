require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function testGrammar() {
    const model = 'gemini-1.5-flash';
    
    console.log("Testing with API Key:", apiKey ? "FOUND" : "MISSING");
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Fix this: I am an enginnering student." }] }],
                })
            }
        );
        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testGrammar();
