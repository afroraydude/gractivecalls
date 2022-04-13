const puppeteer = require('puppeteer');
const Call = require('./../models/newcall');
const crypto = require('crypto');
const fetch = require('node-fetch');
const {UpdateDbWithCall, cleanOldCalls} = require("./databaseHelper");
let keys = [];
let browser;

function cleanAddress(location) {
  // get the first part of the location
  var temp = location.split(" ")[0];
  // if the first character in temp is a number
  if (!isNaN(temp[0])) {
    // replace all X's with 0's
    temp = temp.replace(/X/g, "0");

    // remove the first part of location and add it back with the new temp
    location = location.replace(location.split(" ")[0], temp);
  }
  return location;
}

// Loads a new Chrome Page for the given call to grab from the website
async function loadPageChesterfield(isPD) {
  let incident;
  let time;
  let hash;
  let timeout = 1000;

  let url = "";
  if (isPD) {
    url ="https://www.chesterfield.gov/3999/Active-Police-Calls";
  } else {
    url ="https://www.chesterfield.gov/3913/Active-FireEMS-Calls";
  }

  let page = await browser.newPage();
  await page.setViewport({
    width: 1920, height: 1080
  });

  await page.goto(url);
  await new Promise(r => setTimeout(r, timeout));
  await page.waitForSelector('tbody');
  let result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const columns = Array.from(row.querySelectorAll('td'));
      return columns.map(column => column.innerText);
    });
  })
  for (const row of result) {
    if (row.length === 1) {
      // do nothing
    } else {
      const location = cleanAddress(row[2]);
      time = new Date(row[3]);
      incident = row[4];
      hash = crypto.createHash('md5').update(row[3] + row[1] + row[4] + row[2]).digest("hex");
      keys.push(hash);
      let call = new Call({
        timeReceived: time,
        district: "Chesterfield",
        agency: (isPD) ? "CCPD" : "CCFD",
        incident: incident,
        location: location,
        _id: hash,
        status: (row[5] == "On Scene") ? "Arrived" : row[5]
      });
      await UpdateDbWithCall(call);
    }
  }
}

async function grabChesterfield() {
  browser = await puppeteer.launch({
    headless: true
  });

  // load calls
  await loadPageChesterfield(true);
  await loadPageChesterfield(false);

  await browser.close();

  // close any calls that are still open that were not found in the new results
  await cleanOldCalls(keys, "Chesterfield");
}


module.exports = grabChesterfield;