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

async function runGrabbers() {
  // run all grabbers in parallel and wait for them to finish
  // then wait 60 seconds, then run all grabbers again
  await Promise.all([rG(), hG(), cG()]);
  console.log("Grabbers finished");
  setTimeout(runGrabbers, 60000);
}

module.exports = runGrabbers;