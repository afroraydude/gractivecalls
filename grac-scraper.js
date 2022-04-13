require('dotenv').config()
process.env.TZ = "America/New_York";
const mongoose = require('mongoose');
var grabber = require('./app/run');
const fs = require("fs");
mongoose.connect(process.env.mongodb, { useNewUrlParser: true });

process.on('uncaughtException', function (err) {
    // TODO: Fix this (pm2 doesn't store logs in the project folder)
    let error = new Date() + ' ' + err + '\n';
    if (fs.existsSync("./errors.txt")) {
        fs.appendFileSync("./errors.txt", error);
    } else {
        fs.writeFileSync("./errors.txt", error);
    }
    console.log(error);
    process.exit(1);
})

// run the scraper
grabber();