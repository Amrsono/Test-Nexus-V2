const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides');

for (let i = 1; i <= 5; i++) {
  const slidePath = path.join(slidesDir, `slide${i}.xml`);
  if (!fs.existsSync(slidePath)) {
    console.log(`Slide ${i} does not exist.`);
    continue;
  }
  const content = fs.readFileSync(slidePath, 'utf8');
  console.log(`\n================= SLIDE ${i} =================`);
  
  // Extract text within <a:t>...</a:t>
  const regex = /<a:t>([^<]*)<\/a:t>/g;
  let match;
  let text = [];
  while ((match = regex.exec(content)) !== null) {
    text.push(match[1]);
  }
  
  if (text.length === 0) {
    console.log("(No text found)");
  } else {
    console.log(text.join(' | '));
  }
}
