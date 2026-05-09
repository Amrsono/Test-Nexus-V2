const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto('http://localhost:5173/');

  await page.evaluate(() => {
    localStorage.setItem('nexus_user', JSON.stringify({
      id: "mock-id",
      name: "Admin",
      email: "admin@testnexus.com",
      role: "ADMIN",
      subscriptionStatus: "ACTIVE"
    }));
    localStorage.setItem('nexus_token', "mock-token");
  });

  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing Admin Subs View...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent.includes('Subscription Requests'));
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing Billing View...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const billingBtn = buttons.find(b => b.textContent.includes('Billing'));
    if (billingBtn) billingBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
