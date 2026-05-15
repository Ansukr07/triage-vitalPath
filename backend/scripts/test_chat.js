const axios = require('axios');

async function testChat() {
    try {
        console.log('--- Testing Auth Login ---');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'ansukumar2111@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('Login successful, token obtained.');

        console.log('--- Testing Chat Endpoint ---');
        const chatRes = await axios.post('http://localhost:5000/api/chat', {
            message: 'Hello Assistant, what can you do?',
            history: []
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Chat Response:', chatRes.data.data.reply);
    } catch (err) {
        console.error('Test failed:', err.response?.data || err.message);
    }
}

testChat();
