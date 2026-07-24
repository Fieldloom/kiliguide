const { search } = require("duck-duck-scrape");

async function run() {
  try {
    const results = await search("site:dkut.ac.ke admission requirements");
    console.log("Success:", results.results.slice(0, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
