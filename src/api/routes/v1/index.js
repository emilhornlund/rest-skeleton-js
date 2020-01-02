const express = require('express')
const router = express.Router()

const hasValidAPIKey = require('../../middlewares/v1/hasValidAPIKey')
const hasValidAuthToken = require('../../middlewares/v1/hasValidAuthToken')
const hasAuthority = require('../../middlewares/v1/hasAuthority')

router.use(hasValidAPIKey)

router.use('/auth', require('./authRoute'))
router.use('/apps', hasValidAuthToken, hasAuthority('APP_MANAGEMENT'), require('./appsRoute'))
router.use('/users/me', hasValidAuthToken, require('./meRoute'))
router.use('/users', hasValidAuthToken, hasAuthority('USER_MANAGEMENT'), require('./usersRoute'))

module.exports = router
