from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:4173")
    page.wait_for_timeout(2000) # Give time for three.js to load

    # Click on the Body Selector to change target to ISS
    # We can use the dat.gui panel or the new selection menu.
    # The new selection menu has two select elements.

    # First select the type "Spacecraft"
    type_select = page.locator("select").first
    type_select.select_option("Spacecraft")
    page.wait_for_timeout(1000)

    # Then select the body "ISS (International Space Station)"
    body_select = page.locator("select").nth(1)
    body_select.select_option("ISS (International Space Station)")
    page.wait_for_timeout(2000)

    # Take screenshot at the key moment showing ISS
    page.screenshot(path="/home/jules/verification/screenshots/iss.png")
    page.wait_for_timeout(1000)

    # Select Hubble
    body_select.select_option("Hubble Space Telescope")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/hubble.png")
    page.wait_for_timeout(1000)

    # Select Voyager 1
    body_select.select_option("Voyager 1")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/voyager.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
