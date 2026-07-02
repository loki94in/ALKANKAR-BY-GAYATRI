const https = require('https');
const options = {
  hostname: 'api.jsonbin.io',
  path: `/v3/b/6a462723f5f4af5e2952b748/latest`,
  method: 'GET',
  headers: { 'X-Master-Key': '$2a$10$fgqmDN10xBsjxqX00yGRTOCBOvjfnnkc9TNNRkiyxGCz64Yz2VynK' }
};
https.request(options, res => {
  let d = ''; res.on('data', c => d+=c); res.on('end', () => console.log(d));
}).end();
