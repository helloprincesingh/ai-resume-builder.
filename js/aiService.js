const API_URL = '/api/gemini';

async function callGeminiAPI(prompt, temperature = 0.7) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, temperature })
        });

        const data = await response.json();
        console.log("Gemini API Response:", data);

        if (!response.ok) {
            const errorMsg =
                data.error?.message ||
                (typeof data.error === 'string' ? data.error : null) ||
                "AI service temporarily unavailable";

            console.warn("Gemini API Warning:", errorMsg);

            return `⚠️ AI service is temporarily busy. Please try again in a few seconds.`;
        }

        // Gemini response parsing
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
            let text = candidate.trim();
            // Remove unwanted quotes/markdown
            text = text.replace(/^["*]+|["*]+$/g, '');
            return text;
        }

        return null;
    } catch (error) {
        console.error("API Fetch Error:", error);
        console.warn("Backend connection failed.");
        return "⚠️ Backend connection temporarily failed. Please try again.";
        return null;
    }
}

// 🔹 Advanced AI Resume Assistant - Integrated Improvement Engine
async function improveContent(userText, section = 'General', targetRole = '', jobDescription = '') {

    if (!userText || userText.trim().length < 5) {
        return "Please enter more project details before using AI improvement.";
    }

    const prompt = `
    ...
You are an advanced AI resume assistant with expertise in career consulting, ATS optimization, and professional writing.
Your tasks:
1. Generate tailored suggestions for each resume section (Summary, Skills, Projects, Experience, Education) based on user input and target job role.
2. Rewrite bullet points to be short, impactful, and measurable (include numbers, percentages, or clear outcomes).
3. Ensure grammar correction and maintain a formal, confident, and consistent professional tone throughout.
4. Optimize the resume for ATS systems by analyzing keywords and suggesting missing ones relevant to the role.
5. Provide role-specific tailoring: adjust phrasing and highlight skills most important for the selected job (e.g., Software Engineer, Data Analyst).
6. Suggest alternative sentences or bullet points (2–3 per section) that strengthen achievements and clarity.
7. If a job description is provided, compare it with the resume and recommend improvements to match required keywords and skills.
8. Generate a personalized cover letter draft based on the resume and target role.
9. Offer template‑friendly outputs (clean ATS, modern, creative, minimalist) so the text can fit multiple resume designs.
10. Maintain version consistency: ensure edits can be tracked and compared across drafts.
11. Automatically fix grammar mistakes, spelling mistakes, punctuation, capitalization, and sentence structure.
12. Convert informal or broken English into polished professional English.
13. Example:
Input: "i am a enginneer"
Output: "I am an engineer."
14. Always return grammatically corrected text even if the user input is very short.
CONTEXT: The user is currently editing the "${section}" section.
If the input contains only grammar mistakes or short text, prioritize correction over expansion.
RESPONSE FORMAT (Strictly use these headers so the UI can parse your response):
### 💎 Improved Version
(The optimized, grammatically perfect, and impactful version tailored to the role. Use bullet points if appropriate.)

### 📈 Resume Score & Analysis
Score: (X/100)
- (Brief feedback on why this score was given, including ATS alignment)

### 🚀 Suggested Enhancements
- (Key keywords or metrics to add based on the job description/role)
- (Action verb suggestions)

### ✍️ Alternative Phrasing
- (Alternative option 1)
- (Alternative option 2)

### ✉️ Cover Letter Draft
(Provide a brief cover letter snippet if relevant to the section being edited)

Text: ${userText}
Role: ${targetRole || 'Not specified'}
Job Description (optional): ${jobDescription || 'Not specified'}
    `;

    const suggestion = await callGeminiAPI(prompt, 0.7);
    return suggestion;
}

// Keep fixGrammar as an alias for backward compatibility or update main.js
const fixGrammar = improveContent;

// 🔹 Autocomplete (Next Sentence Suggestions)
async function getAutocomplete(contextText) {
    const shortContext = contextText.slice(-100);
    const prompt = `
You are an advanced AI Resume Assistant.
Given the following partial resume text, provide 3 professional, high-impact completions (2–4 words each).
Context: "${shortContext}"

Return ONLY a comma-separated list of 3 suggestions. No quotes, no numbers.
    `;

    const text = await callGeminiAPI(prompt, 0.3);
    if (text) {
        return text.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    return null;
}
// 🔹 AI Cover Letter Generator
async function generateCoverLetter(resumeData, role, jobDescription) {
    const prompt = `
You are an expert career consultant. Based on the following resume data, target role, and job description, write a professional, high-impact, and highly tailored cover letter.

The cover letter should:
1. Be addressed formally.
2. Clearly state the applicant's name and the role they are applying for.
3. Highlight specific achievements from their resume that directly match the job description.
4. Use a confident, professional tone.
5. Include a strong opening and a professional closing.

Applicant Name: ${resumeData.personalInfo?.name || 'Applicant'}
Role: ${role || 'Candidate'}
Job Description: ${jobDescription || 'Not specified'}
Resume Summary: ${resumeData.summary || ''}
Experience: ${JSON.stringify(resumeData.experience || [])}
Projects: ${JSON.stringify(resumeData.projects || [])}
Skills: ${JSON.stringify(resumeData.skills || [])}

Return the complete cover letter text.
    `;

    return await callGeminiAPI(prompt, 0.7);
}

// 🔹 ATS Keyword Matcher & Analyzer
async function analyzeKeywords(resumeData, jobDescription) {
    if (!jobDescription) return null;

    const resumeText = `${resumeData.summary} ${JSON.stringify(resumeData.skills)} ${JSON.stringify(resumeData.experience)}`;
    
    const prompt = `
Analyze the following resume against the provided job description for ATS keyword compatibility.
1. Extract the most important technical and soft skills from the job description.
2. Compare them against the resume.
3. List exactly which high-priority keywords are missing from the resume.
4. Suggest how to integrate these keywords naturally.

Job Description: ${jobDescription}
Resume Text: ${resumeText}

RESPONSE FORMAT (Markdown):
### 🎯 Keywords Analysis
- **Top Keywords in JD:** (List 5-7 keywords)
- **Matching Keywords:** (List matching keywords)
- **⚠️ Missing Keywords:** (List missing keywords)

### 🚀 Optimization Advice
(Brief advice on how to improve the match)
    `;

    return await callGeminiAPI(prompt, 0.5);
}
// 🔹 AI Job Description / Requirements Generator
async function generateJobRequirements(role) {
    if (!role) return null;

    const prompt = `
You are an expert HR manager. Generate a concise, high-impact list of key requirements, responsibilities, and technical skills for the job role: "${role}".
Format the output as a clean, professional job description that can be used for resume optimization.
Include:
1. Core Responsibilities (3-4 points)
2. Technical Skills & Tools (5-7 items)
3. Soft Skills (3 items)

Return ONLY the description text. No conversational filler.
    `;

    return await callGeminiAPI(prompt, 0.6);
}
// 🔹 AI Bullet Points Generator (for empty fields)
async function generateBullets(title, subtitle = '', contextRole = '', contextJD = '') {
    const prompt = `
You are an expert resume writer. Generate 3-4 high-impact, professional bullet points for a "${title}" role at "${subtitle}".
Context:
- Target Role: ${contextRole || 'Professional'}
- Job Description: ${contextJD || 'Not specified'}

The bullet points should:
1. Use strong action verbs.
2. Include quantifiable metrics or specific tools where possible.
3. Be tailored to the target role if provided.
4. Use a formal and confident tone.

Return ONLY the bullet points, each on a new line starting with "• ". No introductory text.
    `;

    return await callGeminiAPI(prompt, 0.7);
}
