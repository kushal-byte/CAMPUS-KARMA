import * as XLSX from 'xlsx';
import fs from 'fs';

const buffer = fs.readFileSync('ck.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

console.log('Sheet name:', sheetName);
console.log('Total rows:', data.length);
console.log('\nColumn headers:');
if (data.length > 0) {
    console.log(Object.keys(data[0]));
}
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
