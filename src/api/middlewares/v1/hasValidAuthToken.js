const createError = require('http-errors')
const fs = require('fs')
const path = require('path')
const logger = require('../../../logger')
const config = require('../../../config')
const { verifyJWT } = require('../../../helpers/security')

module.exports = (req, res, next) => {
    const authToken = req.headers['X-Auth-Token'] || req.headers['x-auth-token']
    if (authToken !== undefined && authToken !== null) {
        const secret = fs.readFileSync(path.resolve(__dirname, '../../../../', config.jwt.publicKey), 'utf8')
        const options = {
            issuer: config.jwt.issuer,
            subject: 'auth',
            audience: config.jwt.audience
        }
        verifyJWT(authToken, secret, options)
            .then(decoded => {
                const userId = decoded.payload.userId
                const authorities = decoded.payload.authorities
                req.me = { userId, authorities }
                logger.silly(`Did verify auth token for user ${userId}`)
                next()
            })
            .catch(err => {
                logger.error(err)
                next(createError.Unauthorized())
            })
    } else {
        logger.silly('Forbidden access missing auth token header')
        next(createError.Forbidden())
    }
}
