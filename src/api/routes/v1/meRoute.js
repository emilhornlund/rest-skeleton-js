const express = require('express')
const router = express.Router()
const logger = require('../../../logger')
const {
    findUserById
} = require('../../../services/userService')
const { findAllAuthoritiesByUserId } = require('../../../services/authorityService')
const MeResponse = require('../../responses/v1/meResponse')
const ErrorResponse = require('../../responses/v1/errorResponse')

router.route('/')
    .get((req, res, next) => {
        const userId = req.me.userId
        findUserById(userId)
            .then(user => {
                findAllAuthoritiesByUserId(userId)
                    .then(authorities => res.json(MeResponse.fromDTO(user, authorities)))
            })
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

module.exports = router
