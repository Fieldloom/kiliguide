const { scrapeDeKut } = require('../app/actions.ts');

async function test() {
  console.log("Testing scrapeDeKut for https://admissions.dkut.ac.ke ...");
  const res = await scrapeDeKut("https://admissions.dkut.ac.ke");
  console.log("Result:", res.error ? "ERROR: " + res.error : `Title: ${res.title} | Text length: ${res.text?.length}`);
}

test();
