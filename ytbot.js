const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// List of user agents to pick randomly
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
];

// Function to pick a random integer between min and max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to pick a random user agent
function getRandomUserAgent() {
    return userAgents[getRandomInt(0, userAgents.length - 1)];
}

// Function to pick a random viewport size
function getRandomViewport() {
    const widths = [375, 414, 768, 1024, 1366, 1440, 1920];
    const heights = [667, 736, 800, 900, 1080, 1440, 2160];
    return {
        width: widths[getRandomInt(0, widths.length - 1)],
        height: heights[getRandomInt(0, heights.length - 1)]
    };
}

async function runBot() {
    // Create a temporary user data directory
    const userDataDir = path.join(os.tmpdir(), 'puppeteer_profile_' + Date.now());
    console.log("Using temporary profile:", userDataDir);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: userDataDir
    });

    try {
        const numTabs = getRandomInt(2, 4);
        console.log(`Opening ${numTabs} tabs...`);

        const pages = [];
        for (let i = 0; i < numTabs; i++) {
            const page = await browser.newPage();

            // Set random user agent
            const randomUserAgent = getRandomUserAgent();
            await page.setUserAgent(randomUserAgent);
            console.log(`Tab ${i + 1}: Using user agent -> ${randomUserAgent}`);

            // Set random viewport
            const viewport = getRandomViewport();
            await page.setViewport(viewport);
            console.log(`Tab ${i + 1}: Using viewport -> ${viewport.width}x${viewport.height}`);

            pages.push(page);

            const videoUrl = 'https://youtube.com/shorts/M_LhGhtImjs';
            console.log(`Tab ${i + 1}: Opening video...`);
            await page.goto(videoUrl, { waitUntil: 'load', timeout: 60000 });

            const waitBeforeClick = getRandomInt(3000, 7000);
            console.log(`Tab ${i + 1}: Waiting ${waitBeforeClick / 1000}s before clicking...`);
            await new Promise(resolve => setTimeout(resolve, waitBeforeClick));

            console.log(`Tab ${i + 1}: Clicking to start video...`);
            await page.mouse.click(viewport.width / 2, viewport.height / 2);

            const waitBeforeScroll = getRandomInt(7000, 20000);
            console.log(`Tab ${i + 1}: Waiting ${waitBeforeScroll / 1000}s before scrolling...`);
            await new Promise(resolve => setTimeout(resolve, waitBeforeScroll));

            console.log(`Tab ${i + 1}: Scrolling randomly...`);
            const scrollTimes = getRandomInt(3, 5);
            for (let j = 0; j < scrollTimes; j++) {
                const scrollAmount = getRandomInt(200, 800);
                await page.evaluate(y => { window.scrollBy(0, y); }, scrollAmount);
                console.log(`Tab ${i + 1}: Scrolled by ${scrollAmount}px`);
                const waitBetweenScroll = getRandomInt(1000, 3000);
                await new Promise(resolve => setTimeout(resolve, waitBetweenScroll));
            }

            const finalWait = getRandomInt(10000, 30000);
            console.log(`Tab ${i + 1}: Waiting ${finalWait / 1000}s before closing...`);
            await new Promise(resolve => setTimeout(resolve, finalWait));
        }

    } catch (error) {
        console.error("Error occurred:", error);
    } finally {
        console.log("Closing browser...");
        await browser.close();

        // Delete the profile folder to clear everything
        fs.rm(userDataDir, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error("Error deleting profile:", err);
            } else {
                console.log("Profile and all data deleted successfully.");
            }
        });
    }
}

(async () => {
    while (true) {
        console.log("Starting bot iteration...");
        await runBot();
        console.log("Iteration completed. Waiting 10 seconds before next run...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
})();
