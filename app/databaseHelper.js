const Call = require("../models/newcall");
const fetch = require("node-fetch");

// Update the database with the new call
async function UpdateDbWithCall(call) {
  // try to save the call to the database
  try {
    // try to find the call in the database
    let originalCall = await Call.findById(call._id);
    // if original call is not found, or the call doesn't have coordinates, update the call
    if (originalCall === undefined || originalCall === null || originalCall.coords === undefined ||
      originalCall.coords === null || originalCall.coords[0] === 0) {
      call = await Call.findByIdAndUpdate(call._id, call, {upsert: true, new: true});
      let address = `${call.location},${call.district},Virginia,USA`;
      // escape the address so it can be used in the url
      address = encodeURIComponent(address);
      var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };
      let result = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${process.env.MAPBOX_TOKEN}`, requestOptions);
      let json = await result.json();
      let coords = [0, 0]; // default coordinates
      if (json.features !== undefined && json.features.length > 0 && json.features[0].center !== undefined) {
        coords = [json.features[0].center[1], json.features[0].center[0]];
      }
      call.coords = coords;
      // update the call with the new coordinates and save it to the database
      await Call.findByIdAndUpdate(call._id, call, {upsert: true, new: true});
    } else {
      // take the coordinates from the original call and update the database with the new status from the current call
      call.coords = originalCall.coords;
      call = await Call.findByIdAndUpdate(call._id, call, {upsert: true, new: true});
    }
  } catch (err) {
    // if there is an error, log it
    console.log(err);
  }
  return call;
}

async function cleanOldCalls(keys, district) {
  let removedCalls = []
  let calls = await Call.find({district: district, status: {$ne: "Closed"}});
  for (let i = 0; i < calls.length; i++) {
    let call = calls[i];
    if (keys.indexOf(call._id) === -1) {
      removedCalls.push(call._id);
      call.status = "Closed";
      call = await Call.findByIdAndUpdate(call._id, call, {upsert: true});
    }
  }
  console.log(`Removed ${removedCalls.length} calls from ${district}`);
}

// Sends the call to the OneSignal API
async function SendCallToOneSignal(call) {
  var myHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  myHeaders["Content-Type"] = "application/json; charset=utf-8";
  myHeaders["Authorization"] = `Basic ${process.env.ONESIGNAL_TOKEN}`;

  var raw = {
    "app_id": process.env.ONESIGNAL_APP_ID,
    "contents": {
      "en": `${call.location} | ${call.agency}\n${call.incident}`
    },
    "headings": {
      "en": "New Nearby Call"
    },
    "filters": [
      {
        "field":"location",
        "radius":1000,
        "lat":call.coords[0],
        "long":call.coords[1]
      }
    ]
  }

  let body = JSON.stringify(raw);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    redirect: 'follow'
  };

  await fetch("https://onesignal.com/api/v1/notifications", requestOptions);
}

exports.UpdateDbWithCall = UpdateDbWithCall;
exports.cleanOldCalls = cleanOldCalls;