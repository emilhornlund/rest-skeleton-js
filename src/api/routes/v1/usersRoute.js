const express = require('express')
const router = express.Router()
const logger = require('../../../logger')
const {
    findAllUsers,
    createUser,
    findUserById,
    updateUserById,
    deleteUserById
} = require('../../../services/userService')
const {
    findAllAuthoritiesByUserId,
    addAuthoritiesToUserById
} = require('../../../services/authorityService')
const UserResponse = require('../../responses/v1/userResponse')
const AuthorityResponse = require('../../responses/v1/authorityResponse')
const ErrorResponse = require('../../responses/v1/errorResponse')

router.route('/')
    .get((req, res, next) => {
        findAllUsers()
            .then(users => res.json(users.map(UserResponse.fromDTO)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .post((req, res, next) => {
        const username = req.body.username
        const password = req.body.password
        const data = { username, password }
        createUser(data)
            .then(user => res.status(201).json(UserResponse.fromDTO(user)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

router.route('/:userId')
    .get((req, res, next) => {
        findUserById(req.params.userId)
            .then(user => res.json(UserResponse.fromDTO(user)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .patch((req, res, next) => {
        const username = req.body.username
        const data = { username }
        updateUserById(req.params.userId, data)
            .then(user => res.json(UserResponse.fromDTO(user)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .delete((req, res, next) => {
        deleteUserById(req.params.userId)
            .then(user => res.json(UserResponse.fromDTO(user)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

router.route('/:userId/authorities')
    .get((req, res, next) => {
        findAllAuthoritiesByUserId(req.params.userId)
            .then(authorities => res.json(authorities.map(AuthorityResponse.fromDTO)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .post((req, res, next) => {
        addAuthoritiesToUserById(req.body.names, req.params.userId)
            .then(authorities => res.status(201).json(authorities.map(AuthorityResponse.fromDTO)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

module.exports = router
