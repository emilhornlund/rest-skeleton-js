const fs = require('fs')
const path = require('path')
const safeEval = require('safe-eval')
const logger = require('../logger')
const config = require('../config')
const { unwrapValue } = require('../helpers/unwrap')
const { AuthDTO } = require('../models/dto')
const { findUserByUsername, findUserById } = require('../services/userService')
const { createJwt, verifyJWT, destroyJwt } = require('./jwtService')
const { findAllAuthoritiesByUserId } = require('../services/authorityService')
const {
    DomainError,
    NotFoundError,
    InternalError,
    BadCredentialsError
} = require('../errors')
const { verifyHashPassword } = require('../helpers/security')

/**
 * Authenticates an user by username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<DomainError | AuthDTO>}
 */
exports.authenticateUserByUsernameAndPassword = (username, password) => {
    return unwrapValue(username, 'username')
        .then(() => unwrapValue(password, 'password'))
        .then(() => findUserByUsername(username).catch(err => {
            if (err instanceof NotFoundError) return Promise.reject(new BadCredentialsError(username))
            return Promise.reject(err)
        }))
        .then(user => {
            logger.silly(`Will verify user ${user.username} against password`)
            if (verifyHashPassword(password, user.password)) {
                logger.silly(`Password ${user.password} did match user ${user.id}`)
                return Promise.resolve(user)
            } else {
                logger.silly(`Password ${user.password} does not match user ${user.id}`)
                return Promise.reject(new BadCredentialsError(user.username))
            }
        })
        .then(({ id }) => this.authenticateUserById(id))
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(err)
        })
}

/**
 * Authenticates an user by an refresh token
 * @param {string} refreshToken
 * @returns {Promise<DomainError | AuthDTO>}
 */
exports.authenticateUserWithRefreshToken = refreshToken => {
    return unwrapValue(refreshToken, 'refreshToken')
        .then(() => {
            const secret = fs.readFileSync(path.resolve(__dirname, '../../', config.jwt.publicKey), 'utf8')
            const options = {
                issuer: config.jwt.issuer,
                subject: 'refresh',
                audience: config.jwt.audience
            }
            return verifyJWT(refreshToken, secret, options)
        })
        .then(jwt => {
            return destroyJwt(jwt.id)
                .then(() => this.authenticateUserById(jwt.userId))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Authenticates an user by id
 * @param {string} userId
 *
 * @returns {Promise<DomainError | AuthDTO>}
 */
exports.authenticateUserById = userId => {
    const secret = fs.readFileSync(path.resolve(__dirname, '../../', config.jwt.privateKey), 'utf8')
    const jwtPayload = { userId }
    let authJwt, refreshJwt
    return unwrapValue(userId, 'userId')
        .then(() => findUserById(userId))
        .then(() => findAllAuthoritiesByUserId(userId).then(authorities => { jwtPayload.authorities = authorities.map(authority => authority.name) })) // TODO: remove
        .then(() => {
            const options = {
                algorithm: config.jwt.algorithm,
                issuer: config.jwt.issuer,
                subject: 'auth',
                audience: config.jwt.audience,
                expiresIn: safeEval(config.jwt.auth.expiresIn)
            }
            return createJwt(jwtPayload, secret, options).then(jwt => { authJwt = jwt })
        })
        .then(() => {
            const options = {
                algorithm: config.jwt.algorithm,
                issuer: config.jwt.issuer,
                subject: 'refresh',
                audience: config.jwt.audience,
                expiresIn: safeEval(config.jwt.refresh.expiresIn)
            }
            return createJwt(jwtPayload, secret, options).then(jwt => { refreshJwt = jwt })
        })
        .then(() => {
            return Promise.resolve(new AuthDTO(authJwt, refreshJwt))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}
