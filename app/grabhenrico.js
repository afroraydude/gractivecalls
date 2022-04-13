const puppeteer = require('puppeteer');
const Call = require('./../models/newcall');
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs');
const {UpdateDbWithCall, cleanOldCalls} = require("./databaseHelper");

async function grabHenrico() {
  let keys = [];
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080
  });
  await page.goto("https://activecalls.henrico.us");
  await page.waitForSelector('tbody');
  const result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const columns = Array.from(row.querySelectorAll('td'));
      return columns.map(column => column.innerText);
    });
  })
  for (const row of result) {
    let location = row[1]
    let time = new Date().setHours(row[2].split(':')[0], row[2].split(':')[1], 0, 0);
    let now = new Date();
    // if time is in the future, subtract a day
    var hash = crypto.createHash('md5').update(row[2] + row[1] + row[3]).digest("hex");
    if (time > now) {
      time = new Date(time - (24 * 60 * 60 * 1000));
      let error = "call " + hash + " was in future";
      if (fs.existsSync("./bugs.txt")) {
        fs.appendFileSync("./bugs.txt", error);
      } else {
        fs.writeFileSync("./bugs.txt", error);
      }
    }
    var incident = row[3];
    keys.push(hash);
    let call = new Call({
      timeReceived: time,
      district: "Henrico",
      agency: "HCPD",
      incident: incident,
      location: location,
      _id: hash,
      status: row[4]
    });
    await UpdateDbWithCall(call);
  }

  await browser.close();

  // close any calls that are still open that were not found in the new results
  await cleanOldCalls(keys, "Henrico");
}

module.exports = grabHenrico;