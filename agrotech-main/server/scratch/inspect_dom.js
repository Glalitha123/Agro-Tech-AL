import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to page
  console.log('Navigating to http://localhost:5173/trends...');
  await page.goto('http://localhost:5173/trends');
  
  // Wait 4 seconds
  console.log('Waiting 4 seconds...');
  await page.waitForTimeout(4000);
  
  // Check DOM state of selects
  const selectsData = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.map((s, idx) => ({
      index: idx,
      classes: s.className,
      value: s.value,
      disabled: s.disabled,
      options: Array.from(s.options).map(o => ({ value: o.value, text: o.text, selected: o.selected }))
    }));
  });
  
  console.log('Selects data:', JSON.stringify(selectsData, null, 2));
  
  await browser.close();
};

run();
