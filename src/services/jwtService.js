const uuidv4 = require('uuid/v4')
const logger = require('../logger')
const { unwrapValue, unwrapObjectValue } = require('../helpers/unwrap')
const { sequelize, Jwt, User, Authority } = require('../models/dao')
const { JwtDTO } = require('../models/dto')
const { signJWT, verifyJWT } = require('../helpers/security')
const {
    DomainError,
    NotFoundError,
    NotUniqueError,
    InternalError
} = require('../errors')

/**
 * Creates a new JWT
 * @param {object} payload
 * @param {string} secret
 * @param {object} options
 * @returns {Promise<DomainError | JwtDTO>}
 */
exports.createJwt = (payload, secret, options) => {
    const jwtId = uuidv4()
    return unwrapValue(payload, 'payload')
        .then(() => unwrapObjectValue(payload, 'userId'))
        .then(() => unwrapObjectValue(payload, 'authorities'))
        .then(() => unwrapValue(secret, 'secret'))
        .then(() => unwrapValue(options, 'options'))
        .then(() => unwrapObjectValue(options, 'algorithm'))
        .then(() => unwrapObjectValue(options, 'issuer'))
        .then(() => unwrapObjectValue(options, 'subject'))
        .then(() => unwrapObjectValue(options, 'audience'))
        .then(() => unwrapObjectValue(options, 'expiresIn'))
        .then(() => {
            const jwtOptions = { ...options, jwtid: jwtId }
            return signJWT(payload, secret, jwtOptions)
        })
        .then(token => {
            logger.silly(`Will create new Jwt with id ${jwtId} for user ${payload.userId}`)
            return sequelize.transaction(transaction => {
                return User.findOne({ where: { id: payload.userId }, transaction })
                    .then(user => {
                        if (user) {
                            logger.silly(`Found user ${user.username} by id ${user.id}`)
                            return Jwt.create({ id: jwtId, token }, { transaction })
                                .then(jwt => jwt.setUser(user, { transaction }))
                        }
                        logger.warn(`Could not find user by id ${payload.userId}`)
                        return Promise.reject(new NotFoundError(`User.id = ${payload.userId}`))
                    })
            })
        })
        .then(jwt => {
            logger.silly(`Created JWT ${jwt.id} for user ${jwt.UserId}`)
            return Promise.resolve(JwtDTO.fromDAO(jwt))
        })
        .catch(err => {
            logger.error(err)
            if (err.name === 'SequelizeUniqueConstraintError' && err.fields.indexOf('id') !== -1) {
                return Promise.reject(new NotUniqueError(`Jwt.id = ${jwtId}`))
            }
            if (err.name === 'SequelizeUniqueConstraintError' && err.fields.indexOf('token') !== -1) {
                return Promise.reject(new NotUniqueError('Jwt.token = ?'))
            }
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Verifies an JWT
 * @param {string} token
 * @param {string} secret
 * @param {object} options
 * @returns {Promise<DomainError | JwtDTO>}
 */
exports.verifyJWT = (token, secret, options) => {
    return unwrapValue(token, 'token')
        .then(() => unwrapValue(secret, 'secret'))
        .then(() => unwrapValue(options, 'options'))
        .then(() => unwrapObjectValue(options, 'issuer'))
        .then(() => unwrapObjectValue(options, 'subject'))
        .then(() => unwrapObjectValue(options, 'audience'))
        .then(() => verifyJWT(token, secret, options))
        .then(decoded => {
            return unwrapObjectValue(decoded, 'jti')
                .then(() => unwrapObjectValue(decoded, 'payload'))
                .then(() => unwrapObjectValue(decoded.payload, 'userId'))
                .then(() => unwrapObjectValue(decoded.payload, 'authorities'))
                .then(() => {
                    logger.silly(`Will find JWT by id ${decoded.jti} and user id ${decoded.payload.userId}`)
                    const include = [{
                        model: User,
                        where: { id: decoded.payload.userId },
                        required: true,
                        include: [{
                            model: Authority,
                            where: {},
                            as: 'Authorities',
                            required: false
                        }]
                    }]
                    return Jwt.findOne({ where: { id: decoded.jti, token, UserId: decoded.payload.userId }, include })
                })
                .then(jwt => {
                    if (jwt) {
                        logger.silly(`Found JWT by id ${decoded.jti} and user id ${decoded.payload.userId}`)
                        return Promise.resolve(JwtDTO.fromDAO(jwt))
                    } else {
                        logger.info(`Could not find JWT by id ${decoded.jti} and user id ${decoded.payload.userId}`)
                        return Promise.reject(new NotFoundError(`Jwt.id = ${decoded.jti} AND Jwt.UserId = ${decoded.payload.userId}`))
                    }
                })
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Destroys an JWT
 * @param {string} jwtId
 * @returns {Promise<DomainError | JwtDTO>}
 */
exports.destroyJwt = (jwtId) => {
    logger.silly(`Will find and destroy JWT with id ${jwtId}.`)
    return unwrapValue(jwtId, 'jwtId')
        .then(() => {
            return sequelize.transaction(transaction => {
                return Jwt.findOne({ where: { id: jwtId }, transaction })
                    .then(jwt => {
                        if (jwt) {
                            logger.warn(`Will destory JWT with id ${jwtId}.`)
                            return jwt.destroy({ transaction })
                        } else {
                            logger.warn(`Could not find JWT by id ${jwtId}`)
                            return Promise.reject(new NotFoundError(`Jwt.id = ${jwtId}`))
                        }
                    })
            })
        })
        .then(jwt => {
            logger.silly(`Destroyed JWT by id ${jwtId}.`)
            return Promise.resolve(JwtDTO.fromDAO(jwt))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}
