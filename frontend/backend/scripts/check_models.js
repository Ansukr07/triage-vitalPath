require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const key = process.env.LLM_API_KEY;
    if (!key) {
        console.error('LLM_API_KEY not found in .env');
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        // The listModels method might not be in the basic SDK, 
        // but we can try to initialize common ones and see if they work.
        const models = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'gemini-flash-lite-latest',
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash-lite-preview-02-05'
        ];

        console.log('--- Testing Model Accessibility ---');
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Try a very small prompt to check connectivity and quota
                const result = await model.generateContent('Hi');
                const response = await result.response;
                console.log(`[OK] ${modelName}: ${response.text().substring(0, 10)}...`);
            } catch (err) {
                console.log(`[FAIL] ${modelName}: ${err.message.substring(0, 80)}...`);
            }
        }
    } catch (err) {
        console.error('Error during model testing:', err.message);
    }
}

listModels();
