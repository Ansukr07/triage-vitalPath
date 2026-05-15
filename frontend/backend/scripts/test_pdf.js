/**
 * Test script: Checks what text pdf-parse extracts from a PDF,
 * then sends it to the BERT service to see what entities come back.
 *
 * Usage: node scripts/test_pdf.js <path-to-pdf>
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// pdf-parse exports differently depending on version
let pdfParse;
try {
    const mod = require('pdf-parse');
    pdfParse = typeof mod === 'function' ? mod : mod.default || Object.values(mod)[0];
} catch (e) {
    console.error('pdf-parse not available:', e.message);
    process.exit(1);
}

const BERT_URL = process.env.BERT_SERVICE_URL || 'http://127.0.0.1:8001';
const filePath = process.argv[2] ||
    path.join(__dirname, '../uploads/699ac3680971ff1f43aa8360/report-1771770665845-664815527.pdf');

async function main() {
    console.log('📄 Reading:', filePath);
    const buf = fs.readFileSync(filePath);

    console.log('⌛ Parsing PDF with pdf-parse...');
    const pdfData = await pdfParse(buf);

    const text = pdfData.text || '';
    console.log('\n─── PDF TEXT EXTRACTION ───────────────────────────────');
    console.log('Characters extracted:', text.length);
    console.log('Page count:', pdfData.numpages);
    console.log('\nFirst 2000 chars of extracted text:');
    console.log(text.slice(0, 2000) || '[EMPTY — likely a scanned/image PDF]');
    console.log('───────────────────────────────────────────────────────\n');

    if (!text.trim()) {
        console.error('❌ ISSUE FOUND: The PDF has no extractable text layer.');
        console.error('   This is a scanned/image-based PDF. pdf-parse cannot read it.');
        console.error('   Solution: Use an OCR tool like Tesseract or Google Vision API.');
        return;
    }

    // Send to BERT service
    console.log('⌛ Calling BERT /extract...');
    try {
        const [extractRes, classifyRes] = await Promise.all([
            axios.post(`${BERT_URL}/extract`, { text: text.slice(0, 5000) }),
            axios.post(`${BERT_URL}/classify`, { text: text.slice(0, 5000) }),
        ]);

        console.log('\n─── BERT /extract RESULT ───────────────────────────────');
        console.log(JSON.stringify(extractRes.data, null, 2));
        console.log('\n─── BERT /classify RESULT ─────────────────────────────');
        console.log(JSON.stringify(classifyRes.data, null, 2));
    } catch (err) {
        console.error('BERT service error:', err.message);
    }
}

main().catch(console.error);
