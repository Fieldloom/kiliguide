import https from "node:https";

const url = "https://www.dkut.ac.ke/index.php/about-dekut/administrative-units/directorate-of-ict";

https.get(url, { rejectUnauthorized: false }, (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Length:', data.length));
}).on('error', (err) => {
  console.log('Error:', err.message);
});
