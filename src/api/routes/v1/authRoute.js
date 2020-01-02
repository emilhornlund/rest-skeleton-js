const express = require('express')
const router = express.Router()
const logger = require('../../../logger')
const {
    authenticateUserByUsernameAndPassword,
    authenticateUserWithRefreshToken
} = require('../../../services/authService')
const AuthResponse = require('../../responses/v1/authResponse')
const ErrorResponse = require('../../responses/v1/errorResponse')

router.post('/authenticate', (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    authenticateUserByUsernameAndPassword(username, password)
        .then(auth => res.status(200).json(AuthResponse.fromDTO(auth)))
        .catch(err => {
            logger.error(err)
            return next(ErrorResponse.fromError(err))
        })
})

router.post('/refresh', (req, res, next) => {
    const refreshToken = req.headers['X-Refresh-Token'] || req.headers['x-refresh-token']
    authenticateUserWithRefreshToken(refreshToken)
        .then(auth => res.status(200).json(AuthResponse.fromDTO(auth)))
        .catch(err => {
            logger.error(err)
            return next(ErrorResponse.fromError(err))
        })
})

module.exports = router
