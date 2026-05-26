const fs = require('fs');
const Papa = require('papaparse');

const text = fs.readFileSync('Dataset/Campaign report_twin birds.csv', 'utf16le');
const lines = text.split('\n');
const cleanedCsv = lines.slice(2).join('\n');

Papa.parse(cleanedCsv, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    console.log("Total parsed rows:", results.data.length);
    console.log("Sample keys in parsed object:", Object.keys(results.data[0] || {}));
    console.log("First parsed row sample:", results.data[0]);
  },
  error: (err) => {
    console.error("Error during parse:", err);
  }
});
