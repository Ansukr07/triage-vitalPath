const axios = require('axios');

async function testBert() {
    const text = `
    PHYSICAL EXAMINATION
    Diagnosis: Persistent Fever and Cough.
    NB: Contact if you observe Chest pain, Rash, Swelling, Vomiting, Weakness.
    Instructions: Take Paracetamol twice daily. Date: 2026-02-23. Result: None.
    `;
    try {
        const res = await axios.post('http://127.0.0.1:8001/extract', { text });
        console.log("BERT Response:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testBert();
