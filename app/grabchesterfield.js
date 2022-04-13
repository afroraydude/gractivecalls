const puppeteer = require('puppeteer');
const Call = require('./../models/newcall');
const crypto = require('crypto');
const fetch = require('node-fetch');
const UpdateDbWithCall = require('./databaseHelper');
let keys = new Array();
let browser;

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
      const location = row[2];
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

  await loadPageChesterfield(true);
  await loadPageChesterfield(false);

  await browser.close();

  // close any calls that are still open that were not found in the new results
  // TODO: lower the amount of calls to check through when closing calls
  Call.find({
    "district": "Chesterfield"
  }, (err, calls) => {
    calls.forEach(call => {
      // if the call is not in the new results, close it
      if (!keys.includes(call._id)) {
        call.status = "Closed";
      } else {
        // get the first part of the location
        var temp = call.location.split(" ")[0];
        // if the first character in temp is a number
        if (!isNaN(temp[0])) {
          // replace all X's with 0's
          temp = temp.replace(/X/g, "0");

          // remove the first part of location and add it back with the new temp
          call.location = call.location.replace(call.location.split(" ")[0], temp);
        }
      }
      call.save();
    })
  })
}


module.exports = grabChesterfield;