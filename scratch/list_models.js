require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name);
        console.log("Available Models:", JSON.stringify(models, null, 2));
    } catch (e) {
        console.error(e);
    }
}
listModels();
