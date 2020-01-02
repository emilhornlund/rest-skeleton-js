const createError = require('http-errors')
const logger = require('../../../logger')
const { NotFoundError } = require('../../../errors')
const { unwrapObjectValue } = require('../../../helpers/unwrap')

module.exports = authority => {
    return (req, res, next) => {
        logger.silly(`Will verify authority ${authority}`)
        unwrapObjectValue(req.me, 'userId')
            .then(() => unwrapObjectValue(req.me, 'authorities'))
            .then(() => {
                if (req.me.authorities.indexOf(authority) !== -1) {
                    logger.silly(`Verified authority ${authority} for user ${req.me.userId}.`)
                    return next()
                } else {
                    return Promise.reject(new NotFoundError(`Authority.name = ${authority} was not found.`))
                }
            })
            .catch(err => {
                logger.error(err)
                next(createError.Forbidden())
            })
    }
}
