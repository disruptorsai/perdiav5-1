import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xlsxPath = 'C:/Users/Disruptors/Downloads/School_Degree Category_Subject Organization - IPEDS.xlsx';
const outputDir = path.join(__dirname, '..', 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const workbook = XLSX.readFile(xlsxPath);

// Parse categories sheet
const catSheet = workbook.Sheets['subject-cip-bls'];
const catData = XLSX.utils.sheet_to_json(catSheet, { header: 1, range: 0 });

// Extract unique categories and concentrations
const categories = [];
const seenPairs = new Set();

catData.slice(2).forEach(row => {
  const category = row[1] || row[0];
  const categoryId = row[2];
  const concentrationId = row[3];
  const concentration = row[4];

  if (category && categoryId && concentrationId && concentration) {
    const key = `${categoryId}-${concentrationId}`;
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      categories.push({
        category: category.trim(),
        category_id: categoryId,
        concentration_id: concentrationId,
        concentration: concentration.trim().split('\n')[0],
      });
    }
  }
});

// Parse level codes
const levelSheet = workbook.Sheets['Level Codes '];
const levelData = XLSX.utils.sheet_to_json(levelSheet, { header: 1, range: 2 });
const levels = levelData
  .filter(row => row[0] && row[1])
  .map(row => ({
    level_name: row[0].trim(),
    level_code: row[1]
  }));

console.log('Categories found:', categories.length);
console.log('Levels found:', levels.length);
console.log('\nSample categories:', JSON.stringify(categories.slice(0, 5), null, 2));
console.log('\nAll levels:', JSON.stringify(levels, null, 2));

// Write to JSON files
fs.writeFileSync(
  path.join(outputDir, 'monetization-categories.json'),
  JSON.stringify(categories, null, 2)
);
fs.writeFileSync(
  path.join(outputDir, 'monetization-levels.json'),
  JSON.stringify(levels, null, 2)
);

console.log('\nData exported to data/*.json');
