const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const logger = require('../logger')
const {
    DomainError,
    JWTExpiredError,
    JWTMalformedError,
    InternalError
} = require('../errors')
const { unwrapValue, unwrapObjectValue } = require('./unwrap')

/**
 * Get random byte string as hex
 * @param {number} length
 * @returns {string}
 */
exports.randomBytes = length => crypto.randomBytes(length).toString('hex')

/**
 * Creates a new combined hash and salt from a clear text password
 * @param {string} password Clear text password
 * @returns {string} Combined hash and salt
 */
exports.hashPassword = password => {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')
    return [salt, hash].join('$')
}

/**
 * Verifies a clear text password from a combined hash and salt
 * @param {string} password Clear text password
 * @param {string} original Original password hash
 * @returns {boolean} True or false whether the password was correct or not
 */
exports.verifyHashPassword = (password, original) => {
    const originalHash = original.split('$')[1]
    const salt = original.split('$')[0]
    const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')
    return hash === originalHash
}

/**
 * Signs a JWT
 * @param {object} payload
 * @param {secret} secret
 * @param {object} options
 * @returns {Promise<string>}
 */
exports.signJWT = (payload, secret, options) => {
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
        .then(() => unwrapObjectValue(options, 'jwtid'))
        .then(() => {
            logger.silly(`Will sign JWT with user id ${payload.userId} and authorities ${payload.authorities.join(',')}.`)
            return new Promise((resolve, reject) => {
                jwt.sign({ payload }, secret, options, (err, token) => {
                    if (err) {
                        logger.error(err)
                        reject(err)
                    } else resolve(token)
                })
            })
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Verifies a JWT auth token
 * @param {string} token
 * @param {string} secret
 * @param {object} options
 * @returns {Promise<object>}
 */
exports.verifyJWT = (token, secret, options) => {
    logger.silly('Will verify JWT')
    return unwrapValue(token, 'token')
        .then(() => unwrapValue(secret, 'secret'))
        .then(() => unwrapValue(options, 'options'))
        .then(() => unwrapObjectValue(options, 'issuer'))
        .then(() => unwrapObjectValue(options, 'subject'))
        .then(() => unwrapObjectValue(options, 'audience'))
        .then(() => {
            return new Promise((resolve, reject) => {
                jwt.verify(token, secret, options, (err, decoded) => {
                    if (err) {
                        logger.error(err)
                        if (err.name === 'TokenExpiredError') return reject(new JWTExpiredError(err))
                        else return reject(new JWTMalformedError(err))
                    } else {
                        logger.silly('Verified JWT.')
                        resolve(decoded)
                    }
                })
            })
        })
        .then(decoded => {
            return unwrapValue(decoded, 'payload')
                .then(() => unwrapObjectValue(decoded.payload, 'userId'))
                .then(() => unwrapObjectValue(decoded.payload, 'authorities'))
                .then(() => unwrapObjectValue(decoded, 'jti'))
                .then(() => Promise.resolve(decoded))
                .catch(err => Promise.reject(new JWTMalformedError(err)))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}
