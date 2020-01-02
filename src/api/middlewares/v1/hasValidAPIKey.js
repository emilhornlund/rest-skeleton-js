const createError = require('http-errors')
const logger = require('../../../logger')
const { findAppByKey } = require('../../../services/appService')

module.exports = (req, res, next) => {
    const apiKey = req.headers['X-API-key'] || req.headers['x-api-key']
    if (apiKey) {
        findAppByKey(apiKey)
            .then(() => next())
            .catch(err => {
                logger.error(err)
                next(createError.Unauthorized())
            })
    } else {
        logger.silly('Unauthorized access missing API-key')
        next(createError.Unauthorized())
    }
}
