const pdf = require('pdf-parse');
const fs = require('fs');

async function test() {
  try {
    const dataBuffer = fs.readFileSync('hostel.pdf');
    const data = await pdf(dataBuffer);
    console.log("PDF Pages:", data.numpages);
    console.log("PDF Text length:", data.text.length);
    console.log("Preview:", data.text.substring(0, 500));
  } catch(err) {
    console.error("Parse error:", err);
  }
}
test();
