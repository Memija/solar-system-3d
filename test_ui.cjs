const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const testMeasure2 = await page.evaluate(() => {
     const sm = window.sceneManager;
     const measureBtn = Array.from(document.querySelectorAll('.property-name')).find(el => el.textContent === 'Measure Distance');
     measureBtn.closest('.cr.boolean').querySelector('input').click();

     // What is measureMode?
     return sm.measureMode;
  });

  console.log('MeasureMode after click:', testMeasure2);

  await browser.close();
})();
