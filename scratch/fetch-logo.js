const fs = require('fs');
fetch('https://www.dkut.ac.ke')
  .then(res => res.text())
  .then(html => {
    const match = html.match(/<img[^>]+src=["']([^"']*logo[^"']*\.png)["']/i);
    if (match) {
      console.log('Found:', match[1]);
      let url = match[1];
      if (url.startsWith('/')) url = 'https://www.dkut.ac.ke' + url;
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(b => {
          fs.writeFileSync('public/dekut-logo.png', Buffer.from(b));
          console.log('Downloaded logo!');
        });
    } else {
      console.log('Logo not found on page.');
    }
  })
  .catch(console.error);
