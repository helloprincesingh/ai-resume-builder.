require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function testGrammar() {
    const model = 'gemini-2.0-flash-lite';
    
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
        const text = await response.text();
        console.log("Response Status:", response.status);
        console.log("Response Text:", text);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testGrammar();
