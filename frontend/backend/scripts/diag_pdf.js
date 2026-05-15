/**
 * VitalPath — PDF text extraction test
 * Run: node scripts/diag_pdf.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

// How reports.js requires it
const { PDFParse } = require('pdf-parse');

const PDF_PATH = path.join(
    __dirname,
    '../uploads/699ac3680971ff1f43aa8360/report-1771770665845-664815527.pdf'
);

async function postJSON(urlStr, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(urlStr);
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = '';
            res.on('data', (c) => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('─────────────────────────────────────────────────────');
    console.log('📄 PDF Path:', PDF_PATH);
    console.log('─────────────────────────────────────────────────────');

    const buf = fs.readFileSync(PDF_PATH);
    const pdfData = await new PDFParse(buf);
    const text = pdfData.text || '';

    console.log('Pages:', pdfData.numpages);
    console.log('Extracted text length:', text.length);
    console.log('\n=== FIRST 2000 CHARS ===');
    console.log(text.slice(0, 2000) || '[EMPTY — scanned/image PDF with no text layer]');
    console.log('\n─────────────────────────────────────────────────────');

    if (!text.trim()) {
        console.error('\n❌ DIAGNOSIS: PDF has NO extractable text (image/scanned PDF).');
        console.error('   BERT receives empty string → "No clinical entities identified".');
        console.error('   FIX: Implement OCR (e.g. Tesseract via pytesseract).\n');
        return;
    }

    const snippet = text.slice(0, 5000);
    console.log('\n⌛ Sending to BERT extract...');
    const ext = await postJSON('http://127.0.0.1:8001/extract', { text: snippet });
    console.log('\n=== /extract RESULT ===');
    console.log(JSON.stringify(ext, null, 2));

    const cls = await postJSON('http://127.0.0.1:8001/classify', { text: snippet });
    console.log('\n=== /classify RESULT ===');
    console.log(JSON.stringify(cls, null, 2));
}

main().catch(console.error);
