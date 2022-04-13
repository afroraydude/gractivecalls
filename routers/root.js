const express = require('express')
const fs = require('fs')
const {
  parse
} = require('json2csv')
/*
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'out.csv',
  header: [
    {id: 'timeReceived', title: 'Time Received'},
    {id: 'district', title: 'District'},
    {id: 'agency', title: 'Agency'},
    {id: 'incident', title: 'Incident'},
    {id: 'location', title: 'Location'},
  ]
});
*/
var router = express.Router()
const Call = require('./../models/newcall')

const toUtc = (date) => {
  // if date is not a date object, create one
  if (!(date instanceof Date)) {
    date = new Date(date)
  }

  var now_utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours(), date.getMinutes(), date.getSeconds());

  return new Date(now_utc);
}

router.get('/', (req, res) => {
  let data = fs.readFileSync('./info.html', 'utf8')
  // send the html file
  res.send(data)
})

router.get('/active', (req, res) => {
  Call.find({
      "status": {
        "$ne": "Closed"
      }
    }, 'timeReceived district agency incident location coords')
    .sort({'timeReceived': -1})
    .exec((err, calls) => {
      if (err) {
        console.log(err)
        res.send("err")
      } else {
        res.json(calls)
      }
    })
})

router.get('/all', (req, res) => {
  // if there is a token header
  let token = (req.headers.token) ? req.headers.token : (req.query.token) ? req.query.token : null
  if (token) {
    if (token !== process.env.adminToken) {
      res.json({message: "invalid token"})
      return;
    }
    Call.find({}, 'timeReceived district agency incident location coords').sort({
      'timeReceived': 1
    }).exec((err, calls) => {
      if (err) {
        res.status(500).send(err)
      } else {
        res.json(calls)
      }
    })
  } else {
    res.json({
      message: "no token"
    })
  }
})

router.get('/all.csv', (req, res) => {
  let token = (req.headers.token) ? req.headers.token : (req.query.token) ? req.query.token : null
  if (token) {
    if (token !== process.env.adminToken) {
      res.json({message: "invalid token"})
      return;
    }
    Call.find({}, 'timeReceived district agency incident location coords').sort({
      'timeReceived': 1
    }).exec((err, calls) => {
      if (err) {
        res.status(500).send(err)
      } else {
        const fields = ['timeReceived', 'district', 'agency', 'incident', 'location']
        const opts = {
          fields
        }
        const csv = parse(calls, opts)
        res.setHeader('Content-disposition', 'attachment; filename=calls.csv')
        res.set('Content-Type', 'text/csv')
        res.status(200).send(csv)
      }
    })
  } else {
    res.json({
      message: "no token"
    })
  }
})

router.get('/since', (req, res) => {
  let minutes = Number.parseInt(req.query.minutes)

  // if minutes is not a number, default to 1
  if (Number.isNaN(minutes)) {
    minutes = 1
  }

  if (minutes > 1440) {
    minutes = 1440
  }

  let time = new Date()
  time.setMinutes(time.getMinutes() - minutes)
  Call.find({
    timeReceived: {
      $gt: time
    }
  }, 'timeReceived district agency incident location').sort({
    'timeReceived': 1
  }).exec((err, calls) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.json(calls)
    }
  })
})

router.get('/today', (req, res) => {
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  //date = toUtc(date);
  Call.find({
    timeReceived: {
      $gt: date
    }
  }, 'timeReceived district agency incident location').sort({
    'timeReceived': 1
  }).exec((err, calls) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.json(calls)
    }
  })
})

router.get('/today.csv', (req, res) => {
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  //date = toUtc(date);
  Call.find({
    timeReceived: {
      $gt: date
    }
  }, 'timeReceived district agency incident location').sort({
    'timeReceived': 1
  }).exec((err, calls) => {
    if (err) {
      res.status(500).send(err)
    } else {
      const fields = ['timeReceived', 'district', 'agency', 'incident', 'location']
      const opts = {
        fields
      }
      const csv = parse(calls, opts)
      res.setHeader('Content-disposition', 'attachment; filename=calls.csv')
      res.set('Content-Type', 'text/csv')
      res.status(200).send(csv)
    }
  })
})

router.get('/calls', (req, res) => {
  let fromDate = new Date(req.query.fromDate).setHours(0, 0, 0, 0)
  let toDate = new Date(req.query.toDate).setHours(23, 59, 59, 999)
  let count = Number.parseInt(req.query.count)
  let district = req.query.district
  let agency = req.query.agency

  // if count is not a number, default to 10
  if (Number.isNaN(count)) {
    count = 10
  } else if (count > 100) {
    count = 100
  }

  // if fromDate is not a date, default to 1/1/1970
  if (isNaN(fromDate) || fromDate <= 0) {
    fromDate = new Date(0).setHours(0, 0, 0, 0)
  }

  // if toDate is not a date, default to today
  if (isNaN(toDate)) {
    toDate = new Date().setHours(23, 59, 59, 999)
  }

  // if district is not a string, default to all
  if (typeof district !== 'string') {
    district = ''
  }

  // if agency is not a string, default to all
  if (typeof agency !== 'string') {
    agency = ''
  }

  //fromDate = toUtc(new Date(fromDate))
  //toDate = toUtc(new Date(toDate))
  console.log(fromDate)
  console.log(toDate)

  Call.find({
        timeReceived: {
          $gt: fromDate,
          $lt: toDate
        },
        district: (district === '') ? {
          "$in": ["Richmond", "Chesterfield", "Henrico"]
        } : district,
        agency: (agency === '') ? {
          "$in": ["RPD", "RFD", "CCPD", "CCFD", "HCPD"]
        } : agency
      },
      'timeReceived district agency incident location')
    .sort({
      'timeReceived': -1
    })
    .limit(count).exec((err, calls) => {
      if (err) {
        res.status(500).send(err)
      } else {
        res.json(calls)
      }
    })
})

router.get('/calls.csv', (req, res) => {
  let fromDate = new Date(req.query.fromDate).setHours(0, 0, 0, 0)
  let toDate = new Date(req.query.toDate).setHours(23, 59, 59, 999)
  let count = Number.parseInt(req.query.count)
  let district = req.query.district
  let agency = req.query.agency

  // if count is not a number, default to 10
  if (Number.isNaN(count)) {
    count = 10
  } else if (count > 100) {
    count = 100
  }

  // if fromDate is not a date, default to 1/1/1970
  if (isNaN(fromDate)) {
    fromDate = new Date(0).setHours(0, 0, 0, 0)
  }

  // if toDate is not a date, default to today
  if (isNaN(toDate)) {
    toDate = new Date().setHours(23, 59, 59, 999)
  }

  // if district is not a string, default to all
  if (typeof district !== 'string') {
    district = ''
  }

  // if agency is not a string, default to all
  if (typeof agency !== 'string') {
    agency = ''
  }

  fromDate = toUtc(new Date(fromDate))
  toDate = toUtc(new Date(toDate))

  Call.find({
        timeReceived: {
          $gt: fromDate,
          $lt: toDate
        },
        district: (district === '') ? {
          "$in": ["Richmond", "Chesterfield", "Henrico"]
        } : district,
        agency: (agency === '') ? {
          "$in": ["RPD", "RFD", "CCPD", "CCFD", "HCPD"]
        } : agency
      },
      'timeReceived district agency incident location')
    .sort({
      'timeReceived': -1
    })
    .limit(count).exec((err, calls) => {
      if (err) {
        res.status(500).send(err)
      } else {
        const fields = ['timeReceived', 'district', 'agency', 'incident', 'location']
        const opts = {
          fields
        }
        const csv = parse(calls, opts)
        res.setHeader('Content-disposition', 'attachment; filename=calls.csv')
        res.set('Content-Type', 'text/csv')
        res.status(200).send(csv)
      }
    })
})

router.get("/alert", (req, res) => {
  if (fs.existsSync("alerts.json")) {
    return res.json(JSON.parse(fs.readFileSync("alerts.json")))
  } else {
    fs.writeFileSync("alerts.json", JSON.stringify([]))
    return res.json([])
  }
})

module.exports = router