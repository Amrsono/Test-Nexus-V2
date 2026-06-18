const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides');

for (let i = 1; i <= 5; i++) {
  const slidePath = path.join(slidesDir, `slide${i}.xml`);
  if (!fs.existsSync(slidePath)) continue;
  
  const content = fs.readFileSync(slidePath, 'utf8');
  console.log(`\n================= SLIDE ${i} XML =================`);
  
  // Let's find each <a:t> tag and see what it contains
  const regex = /(<a:t>[^<]*<\/a:t>)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(match[1]);
  }
}
