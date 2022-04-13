const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Call = require('./../models/newcall');
const csv = require("csv-parser");
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const {UpdateDbWithCall, cleanOldCalls} = require("./databaseHelper");

async function downloadCsv() {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  const path = process.cwd();

  await page.goto('https://apps.richmondgov.com/applications/ActiveCalls');
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path
  });
  await page.waitForSelector('.buttons-csv');
  await page.click('.buttons-csv');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

async function grabRichmond() {
  let keys = [];
  await downloadCsv();
  const path = process.cwd();
  const file = './Active Calls.csv';
  fs.createReadStream(file)
    .pipe(csv())
    .on('data', async (data) => {
      var time = new Date(data['Time Received']);
      var hash = crypto.createHash('md5').update(data['Time Received'] + data['District'] + data['Agency'] + data['Incident'] + data['Location']).digest("hex");
      keys.push(hash);
      let address = `${data['Location']},Richmond,VA`;
      let call = new Call({
        _id: hash,
        timeReceived: time,
        location: data['Location'],
        district: "Richmond",
        agency: data['Agency'],
        incident: data['Call Type'],
        status: data['Status'],
      })
      await UpdateDbWithCall(call);
    })
    .on('end', () => {
      fs.unlinkSync(file);
    });

  // clean old calls
  await cleanOldCalls(keys, "Richmond");
}

module.exports = grabRichmond;