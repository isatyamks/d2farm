/**
 * CSV Utility Module for D2Farm
 * Read/Write/Append CSV files as a lightweight local database
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read a CSV file and return array of objects
 */
function readCSV(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return [];

    const raw = fs.readFileSync(filepath, 'utf-8').trim();
    if (!raw) return [];

    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        // Handle commas inside quoted fields
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const obj = {};
        headers.forEach((h, idx) => {
            let val = values[idx];
            // Auto-convert numbers
            if (val !== '' && !isNaN(val) && val !== 'true' && val !== 'false') {
                obj[h] = parseFloat(val);
            } else if (val === 'true') {
                obj[h] = true;
            } else if (val === 'false') {
                obj[h] = false;
            } else {
                obj[h] = val;
            }
        });
        rows.push(obj);
    }
    return rows;
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Write array of objects to CSV (overwrite)
 */
function writeCSV(filename, data) {
    if (!data || data.length === 0) return;

    const filepath = path.join(DATA_DIR, filename);
    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];

    data.forEach(row => {
        const vals = headers.map(h => {
            const v = row[h] !== undefined ? String(row[h]) : '';
            return v.includes(',') ? `"${v}"` : v;
        });
        lines.push(vals.join(','));
    });

    fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');
}

/**
 * Append a single row to a CSV file
 */
function appendCSV(filename, row) {
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
        // Create file with headers
        const headers = Object.keys(row);
        fs.writeFileSync(filepath, headers.join(',') + '\n', 'utf-8');
    }

    // Read headers from file
    const firstLine = fs.readFileSync(filepath, 'utf-8').split('\n')[0].trim();
    const headers = firstLine.split(',').map(h => h.trim());

    const vals = headers.map(h => {
        const v = row[h] !== undefined ? String(row[h]) : '';
        return v.includes(',') ? `"${v}"` : v;
    });

    fs.appendFileSync(filepath, vals.join(',') + '\n', 'utf-8');
}

module.exports = { readCSV, writeCSV, appendCSV, DATA_DIR };
