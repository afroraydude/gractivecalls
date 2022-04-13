require('dotenv').config()
process.env.TZ = "America/New_York";
let express = require('express');
let app = express();
app.set('trust proxy', 1)
let fs = require('fs');
const cors = require('cors');
let rootRouter = require('./routers/root');
const port = 8000
const mongoose = require('mongoose');
var helmet = require('helmet')
const rateLimit = require('express-rate-limit')
// TODO: Fix helmet
//app.use(helmet())
app.disable('x-powered-by')
mongoose.connect(process.env.mongodb, { useNewUrlParser: true });
const mongoSanitize = require('express-mongo-sanitize');
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('static-site'))
app.use(mongoSanitize());

app.use(function (req, res, next) {
  res.set("Content-Security-Policy", "script-src maps.googleapis.com maps.google.com; style-src 'unsafe-inline'; frame-src maps.google.com maps.googleapis.com; img-src data: blob: *.googleapis.com maps.google.com maps.gstatic.com www.gstatic.com *.ggpht.com; font-src data:; connect-src maps.googleapis.com maps.google.com;");
  next();
});

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to API calls only
app.use('/api', limiter)

app.use('/api', rootRouter);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
}
);

//var chesterfield = require('./app/grabchesterfield');
//chesterfield();

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