const puppeteer = require('puppeteer-extra');
const fs = require('fs');
puppeteer.use(require('puppeteer-extra-plugin-stealth')());

function randomDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randint(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.0.0 Mobile/15E148 Safari/604.1'
];

const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 412, height: 915 },
  { width: 390, height: 844 },
];

async function humanMoveMouse(page, moves = randint(8, 28)) {
  const vw = page.viewport();
  for (let i = 0; i < moves; i++) {
    const x = randint(10, (vw.width || 800) - 10);
    const y = randint(10, (vw.height || 600) - 10);
    await page.mouse.move(x, y, { steps: randint(8, 30) });
    await page.waitForTimeout(randomDelay(60, 320));
  }
}

async function humanScrollPattern(page) {
  const fullHeight = await page.evaluate(() => document.body.scrollHeight || document.documentElement.scrollHeight).catch(()=>0);
  const viewport = page.viewport();
  const passes = randint(2, 5);
  for (let p = 0; p < passes; p++) {
    const maxScroll = Math.min(fullHeight || (viewport.height || 800) * randint(1, 3), (viewport.height || 800) * randint(1,3));
    const step = randint(Math.max(100, Math.floor((viewport.height || 800) / 6)), Math.floor((viewport.height || 800) / 2));
    let cur = 0;
    while (cur < maxScroll) {
      await page.evaluate(y => window.scrollBy(0, y), step).catch(()=>{});
      cur += step;
      await page.waitForTimeout(randomDelay(500, 1800));
      if (Math.random() < 0.07) {
        await page.evaluate(y => window.scrollBy(0, -y), randint(20, 100)).catch(()=>{});
      }
    }
    await page.waitForTimeout(randomDelay(700, 2000));
  }
}

async function waitOnReferrer(page) {
  const waitTime = randomDelay(60000, 120000); // 1–2 minutes
  const start = Date.now();
  while (Date.now() - start < waitTime) {
    await humanMoveMouse(page, randint(3,10));
    await page.evaluate(() => window.scrollBy(0, Math.floor(Math.random()*100)-50)).catch(()=>{});
    await page.waitForTimeout(randomDelay(2000, 6000));
  }
}

async function clickLearnWithBlogLink(page) {
  const clicked = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="learnwithblog.xyz"]'));
    if (!anchors.length) return false;
    const el = anchors[Math.floor(Math.random() * anchors.length)];
    el.target = '_self';
    el.click();
    return true;
  }).catch(()=>false);
  return clicked;
}

async function humanOnTarget(page, targetUrl) {
  console.log(`👀 On target: ${targetUrl}, simulating human behavior.`);
  await humanScrollPattern(page);
  await humanMoveMouse(page, randint(10, 36));
  
  if (Math.random() < 0.35) {
    try {
      const input = await page.$('input[type="search"], input[placeholder], input[name*="q"], textarea').catch(()=>null);
      if (input) {
        const txt = ['test', 'hello', 'puppeteer', 'query'][Math.floor(Math.random()*4)];
        await input.click({ clickCount: 1 }).catch(()=>{});
        for (const ch of txt) {
          await page.keyboard.type(ch);
          await page.waitForTimeout(randomDelay(80, 220));
        }
        if (Math.random() < 0.5) { await page.keyboard.press('Enter').catch(()=>{}); await page.waitForTimeout(randomDelay(800, 2500)); }
      }
    } catch(_) {}
  }

  // Final wait: 2–5 minutes
  const totalWait = randomDelay(120000, 300000);
  const start = Date.now();
  while (Date.now() - start < totalWait) {
    const chunk = Math.min(randomDelay(5000, 20000), totalWait - (Date.now() - start));
    await page.waitForTimeout(chunk);
    if (Math.random() < 0.5) await humanMoveMouse(page, randint(3, 12));
    if (Math.random() < 0.25) await page.evaluate(() => window.scrollBy(0, Math.floor((Math.random()*200)-100))).catch(()=>{});
  }
  console.log(`✅ Finished human-like session (~${Math.round(totalWait/1000)}s).`);
}

(async () => {
  const tweetUrl = 'https://x.com/GhostReacondev/status/1981679871513575623';
  const targetUrl = 'https://learnwithblog.xyz';
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent(UA_LIST[randint(0, UA_LIST.length-1)]);
  const vp = viewports[randint(0, viewports.length-1)];
  await page.setViewport({ width: vp.width, height: vp.height });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  console.log('🚀 Opening tweet...');
  await page.goto(tweetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('⏳ Waiting 1–2 minutes on the tweet...');
  await waitOnReferrer(page);

  console.log('🔗 Clicking LearnWithBlog.xyz link...');
  const clicked = await clickLearnWithBlogLink(page);
  if (!clicked) {
    console.log('❌ Could not find LearnWithBlog.xyz link on tweet, navigating directly.');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  await humanOnTarget(page, targetUrl);

  console.log('🎉 Done! Closing browser.');
  await browser.close();
})();
