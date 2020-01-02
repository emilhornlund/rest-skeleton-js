const express = require('express')
const router = express.Router()
const logger = require('../../../logger')
const {
    findAllApps,
    createApp,
    findAppById,
    updateAppById,
    deleteAppById
} = require('../../../services/appService')
const AppResponse = require('../../responses/v1/appResponse')
const ErrorResponse = require('../../responses/v1/errorResponse')

router.route('/')
    .get((req, res, next) => {
        findAllApps()
            .then(apps => res.json(apps.map(AppResponse.fromDTO)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .post((req, res, next) => {
        createApp({ name: req.body.name })
            .then(app => res.status(201).json(AppResponse.fromDTO(app)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

router.route('/:appId')
    .get((req, res, next) => {
        findAppById(req.params.appId)
            .then(app => res.json(AppResponse.fromDTO(app)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .patch((req, res, next) => {
        const name = req.body.name
        updateAppById(req.params.appId, { name })
            .then(app => res.json(AppResponse.fromDTO(app)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })
    .delete((req, res, next) => {
        deleteAppById(req.params.appId)
            .then(app => res.json(AppResponse.fromDTO(app)))
            .catch(err => {
                logger.error(err)
                return next(ErrorResponse.fromError(err))
            })
    })

module.exports = router
