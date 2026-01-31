/**
 * Quick script to preview the Excel file structure
 * Run with: node scripts/parse-excel-preview.js
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../docs/client/List of Client Schools and Degrees for AI Training.xlsx');

console.log('Reading Excel file:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);

  console.log('\n=== SHEET NAMES ===');
  console.log(workbook.SheetNames);

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n=== SHEET: ${sheetName} ===`);

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Show headers (first row)
    if (data.length > 0) {
      console.log('\nHeaders (Row 1):');
      console.log(data[0]);

      console.log('\nFirst 5 data rows:');
      for (let i = 1; i < Math.min(6, data.length); i++) {
        console.log(`Row ${i + 1}:`, data[i]);
      }

      console.log(`\nTotal rows: ${data.length}`);
    }
  }
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}
