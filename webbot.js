const puppeteer = require('puppeteer-extra');
const fs = require('fs');
puppeteer.use(require('puppeteer-extra-plugin-stealth')());

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🎨 Device profiles
const devices = [
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', width: 1366, height: 768 },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', width: 1440, height: 900 },
  { ua: 'Mozilla/5.0 (Linux; Android 11; Mobile)', width: 412, height: 915 },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', width: 390, height: 844 },
];

async function humanView(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (err) {
    console.log('❌ Page failed to load, skipping this tab...');
    return;
  }

  // Random scrolls
  for (let i = 0; i < randomDelay(5, 10); i++) {
    const scrollDistance = randomDelay(200, 1000);
    await page.evaluate((y) => window.scrollBy(0, y), scrollDistance);
    await new Promise(r => setTimeout(r, randomDelay(1000, 3000)));
  }

  // Random clicks
  const elements = await page.$$('a, button');
  for (let i = 0; i < randomDelay(1, 3); i++) {
    if (elements.length > 0) {
      const el = elements[Math.floor(Math.random() * elements.length)];
      try {
        await el.click();
        await new Promise(r => setTimeout(r, randomDelay(2000, 5000)));
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch {}
    }
  }

  const watchTime = randomDelay(20000, 50000);
  console.log(`👀 Staying on page for ${watchTime / 1000}s`);
  await new Promise(r => setTimeout(r, watchTime));
}

(async () => {
  const url = 'https://www.learnwithblog.xyz'; // change if needed
  let run = 1;
  let lastProfile = null;

  while (true) {
    console.log(`🚀 Run #${run}`);

    if (lastProfile && fs.existsSync(lastProfile)) {
      fs.rmSync(lastProfile, { recursive: true, force: true });
      console.log(`🧹 Deleted old profile: ${lastProfile}`);
    }

    const userDataDir = `/tmp/profile_${Date.now()}`;
    lastProfile = userDataDir;

    const browser = await puppeteer.launch({
      headless: false, // keep visible
      userDataDir,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const tabs = randomDelay(3, 6);
    console.log(`🪄 Opening ${tabs} tabs`);

    for (let i = 0; i < tabs; i++) {
      const page = await browser.newPage();

      // Pick random device
      const device = devices[Math.floor(Math.random() * devices.length)];
      await page.setUserAgent(device.ua);
      await page.setViewport({ width: device.width, height: device.height });

      // 🔑 Important: force open tab immediately
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      humanView(page, url); // don't await, run async
    }

    // Wait for this run
    await new Promise(r => setTimeout(r, randomDelay(60000, 90000)));

    await browser.close();
    console.log('✅ Closed browser and cleared history');

    run++;
  }
})();
