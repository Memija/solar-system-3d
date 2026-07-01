const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const testMeasure = await page.evaluate(() => {
     const sm = window.sceneManager;
     sm.toggleMeasureMode(true);
     sm.setMeasureTarget('Earth');
     sm.setMeasureTarget('Moon');

     sm.updateMeasurement();

     return {
         targetA: sm.measureTargetA?.data?.name,
         targetB: sm.measureTargetB?.data?.name,
         lineVisible: sm.measureLine.visible,
         labelVisible: sm.measureLabel.visible,
         labelScale: sm.measureLabel.scale
     };
  });

  console.log('Measure results:', testMeasure);

  const testSurface = await page.evaluate(() => {
     const sm = window.sceneManager;
     sm.setSurfaceView('Earth');

     // Update is called automatically by animation loop
     return new Promise(resolve => {
        setTimeout(() => {
           resolve({
              surfaceBody: sm.surfaceViewBody?.data?.name,
              cameraPos: sm.camera.position,
              planetPos: sm.surfaceViewBody?.mesh?.position
           });
        }, 100);
     });
  });

  console.log('Surface results:', testSurface);

  await browser.close();
})();
