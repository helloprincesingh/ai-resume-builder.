require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const modelNames = data.models ? data.models.map(m => m.name) : [];
        console.log("Model Names:", modelNames);
    } catch (e) {
        console.error(e);
    }
}
listModels();
