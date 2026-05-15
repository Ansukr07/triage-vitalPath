const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.LLM_API_KEY;

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url);
        fs.writeFileSync('models_full.json', JSON.stringify(response.data, null, 2));
        console.log('Successfully wrote models_full.json');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
