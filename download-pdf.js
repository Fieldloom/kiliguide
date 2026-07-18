const https = require('https');
const fs = require('fs');

const agent = new https.Agent({ rejectUnauthorized: false });

https.get('https://www.dkut.ac.ke/downloads/External-Hostels-around-Dedan-Kimathi-University-of-Technology-2026.pdf', { agent }, (res) => {
  const file = fs.createWriteStream('hostel.pdf');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete');
  });
}).on('error', (err) => {
  console.error('Download error:', err.message);
});
