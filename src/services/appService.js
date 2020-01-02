const logger = require('../logger')
const { unwrapValue, unwrapObjectValue } = require('../helpers/unwrap')
const { App } = require('../models/dao')
const { AppDTO } = require('../models/dto')
const { randomBytes } = require('../helpers/security')
const {
    DomainError,
    NotFoundError,
    InternalError
} = require('../errors')

/**
 * Find all apps
 * @returns {Promise<DomainError | AppDTO[]>}
 */
exports.findAllApps = () => {
    logger.silly('Will find all apps')
    return App.findAll({ order: [['name', 'ASC']] })
        .then(apps => {
            logger.silly(`Found ${apps.length} app(s)`)
            return Promise.resolve(apps.map(AppDTO.fromDAO))
        })
        .catch(err => {
            logger.error(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Creates a new app
 * @param {object} data
 * @returns {Promise<DomainError | AppDTO>}
 */
exports.createApp = data => {
    return unwrapValue(data, 'data')
        .then(() => unwrapObjectValue(data, 'name'))
        .then(() => {
            logger.silly(`Will create app ${data.name}`)
            return App.create({ name: data.name, key: randomBytes(32) })
        })
        .then(app => {
            logger.silly(`Created app ${data.name} with id ${app.id}`)
            return Promise.resolve(AppDTO.fromDAO(app))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Find app by id
 * @param {string} appId
 * @returns {Promise<DomainError | AppDTO>}
 */
exports.findAppById = appId => {
    return unwrapValue(appId, 'appId')
        .then(() => {
            logger.silly(`Will find app by id ${appId}`)
            return App.findOne({ where: { id: appId } })
        })
        .then(app => {
            if (app) {
                logger.silly(`Found app ${app.name} by id ${appId}`)
                return Promise.resolve(AppDTO.fromDAO(app))
            }
            logger.warn(`Could not find app by id ${appId}`)
            return Promise.reject(new NotFoundError(`App.id = ${appId}`))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Find app by key
 * @param {string} key
 * @returns {Promise<DomainError | AppDTO>}
 */
exports.findAppByKey = key => {
    return unwrapValue(key, 'key')
        .then(() => {
            logger.silly('Will find app by key')
            return App.findOne({ where: { key } })
        })
        .then(app => {
            if (app) {
                logger.silly(`Found app ${app.name}`)
                return Promise.resolve(AppDTO.fromDAO(app))
            }
            logger.warn('Could not find app by key')
            return Promise.reject(new NotFoundError('App.key = ?'))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Updates an app by id
 * @param {string} appId
 * @param {object} data
 * @returns {Promise<DomainError | AppDTO>}
 */
exports.updateAppById = (appId, data) => {
    return unwrapValue(appId, 'appId')
        .then(() => unwrapValue(data, 'data'))
        .then(() => {
            logger.silly('Will find app by id')
            return App.findOne({ where: { id: appId } })
        })
        .then(app => {
            if (app) {
                logger.silly(`Found app ${app.name} by id ${appId}`)
                logger.silly(`Will update app by id ${appId}`)
                return app.update({ name: data.name || app.name })
            }
            logger.warn(`Could not find app by id ${appId}`)
            return Promise.reject(new NotFoundError(`App.id = ${appId}`))
        })
        .then(app => {
            logger.silly(`Updated app ${app.name} by id ${appId}`)
            return Promise.resolve(AppDTO.fromDAO(app))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Deletes an app by id
 * @param {string} appId
 * @returns {Promise<DomainError | AppDTO>}
 */
exports.deleteAppById = appId => {
    return unwrapValue(appId, 'appId')
        .then(() => {
            logger.silly('Will find app by id')
            return App.findOne({ where: { id: appId } })
        })
        .then(app => {
            if (app) {
                logger.silly(`Found app ${app.name} by id ${appId}`)
                logger.silly(`Will delete app ${app.name} by id ${appId}`)
                return app.destroy()
            }
            logger.silly(`Could not find app by id ${appId}`)
            return Promise.reject(new NotFoundError(`App.id = ${appId}`))
        })
        .then(app => {
            logger.silly(`Deleted app ${app.name} by id ${appId}`)
            return Promise.resolve(AppDTO.fromDAO(app))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}
