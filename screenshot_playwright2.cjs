const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:4173');

    await page.waitForTimeout(2000);

    // Look for the date display element (it has inline styles and might not have a specific class)
    // We can target it based on its background color or click the first div with cursor: pointer inside the UI container

    // Evaluate in browser to find and click the custom date picker display
    await page.evaluate(() => {
        // Find the element with text containing a year (e.g. 2024-xx-xx)
        const divs = Array.from(document.querySelectorAll('div'));
        const datePickerDiv = divs.find(d => d.style.cursor === 'pointer' && d.textContent.match(/^\d{4}-\d{2}-\d{2}$/));
        if (datePickerDiv) {
            datePickerDiv.click();
        }
    });

    await page.waitForTimeout(1000);

    // Select the first historical event
    // The select might not have a class either, but we know it's inside the custom date picker which is appended to domElement
    await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        // Find the select that contains "Historical Events..."
        const eventSelect = Array.from(selects).find(s => s.options.length > 0 && s.options[0].textContent === 'Historical Events...');
        if (eventSelect) {
            eventSelect.selectedIndex = 1; // Select first real option
            eventSelect.dispatchEvent(new Event('change'));
        }
    });

    await page.waitForTimeout(1000);

    // Take a screenshot of the whole page to see the selected state
    await page.screenshot({ path: 'screenshot_event_selected.png' });

    // Select a date earlier than 0 to test BC output
    await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="number"]');
        const yearInput = Array.from(inputs).find(i => i.min === "-9999"); // From CustomDatePicker.ts
        if (yearInput) {
            yearInput.value = "-500";
            yearInput.dispatchEvent(new Event('change'));
        }
    });

    await page.waitForTimeout(1000);
    // Take screenshot of the whole page
    await page.screenshot({ path: 'screenshot_bc_display.png' });

    await browser.close();
})();
