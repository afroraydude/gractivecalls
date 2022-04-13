const chesterfield = require('./grabchesterfield');
const richmond = require('./grabrichmond');
const henrico = require('./grabhenrico');

async function rG() {
  await richmond();
  console.log("Grabbed Richmond");
}

async function hG() {
  await henrico();
  console.log("Grabbed Henrico");
}

async function cG() {
  await chesterfield();
  console.log("Grabbed Chesterfield");
}

async function internalRun() {
  console.log("Grabbing calls");
  await Promise.all([rG(), hG(), cG()]);
  console.log("Grabbed all calls");
}


function runGrabbers() {
  // call internalRun() every minute
  setInterval(internalRun, 60000);
}

module.exports = runGrabbers;