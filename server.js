const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Paths to data files
const JSON_FILE_PATH = path.join(__dirname, 'enquiries.json');
const CSV_FILE_PATH = path.join(__dirname, 'enquiries.csv');

// Initialize CSV header if file doesn't exist
if (!fs.existsSync(CSV_FILE_PATH)) {
    const csvHeader = 'Timestamp,Name,Email,Phone,Plan\n';
    fs.writeFileSync(CSV_FILE_PATH, csvHeader, 'utf8');
}

// POST endpoint for enquiries
app.post('/submit-enquiry', (req, res) => {
    const { name, email, phone, plan } = req.body;

    if (!name || !email || !phone || !plan) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const timestamp = new Date().toLocaleString();
    const newEnquiry = { timestamp, name, email, phone, plan };

    // 1. Save to JSON file
    let enquiries = [];
    if (fs.existsSync(JSON_FILE_PATH)) {
        try {
            const fileData = fs.readFileSync(JSON_FILE_PATH, 'utf8');
            enquiries = JSON.parse(fileData);
        } catch (err) {
            console.error('Error reading JSON file, resetting list:', err);
        }
    }
    enquiries.push(newEnquiry);
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(enquiries, null, 2), 'utf8');

    // 2. Save to CSV file
    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
    };

    const csvRow = `${escapeCsv(timestamp)},${escapeCsv(name)},${escapeCsv(email)},${escapeCsv(phone)},${escapeCsv(plan)}\n`;
    fs.appendFileSync(CSV_FILE_PATH, csvRow, 'utf8');

    console.log(`[Success] New enquiry received from: ${name} (${email}) for plan: ${plan}`);

    res.json({ success: true, message: 'Enquiry saved successfully!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`INCH BY INCH FITNESS server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`Data will be saved to:`);
    console.log(`📁 ${JSON_FILE_PATH}`);
    console.log(`📁 ${CSV_FILE_PATH}`);
    console.log(`==================================================`);
});
