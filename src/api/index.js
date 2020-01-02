const express = require('express')
const rateLimit = require('express-rate-limit')
const config = require('../config')

const router = express.Router()

router.use(rateLimit(config.server['rate-limit']))

const v1 = require('./routes/v1')
router.use('/v1', v1)

module.exports = router
