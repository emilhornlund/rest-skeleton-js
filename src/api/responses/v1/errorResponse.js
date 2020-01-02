const createError = require('http-errors')
const {
    NotFoundError,
    NotUniqueError,
    NotNullViolationError,
    BadCredentialsError,
    JWTExpiredError,
    JWTMalformedError
} = require('../../../errors')

/**
 * ErrorResponse class
 */
module.exports = class ErrorResponse extends Error {
    /**
     * Converts a AuthDTO model instance into an AuthResponse model instance
     * @param {Error} error
     * @returns {ErrorResponse}
     */
    static fromError (error) {
        switch (error.constructor) {
        case NotFoundError:
            return createError.NotFound(error.message)
        case NotUniqueError:
        case NotNullViolationError:
        case BadCredentialsError:
        case JWTMalformedError:
            return createError.BadRequest(error.message)
        case JWTExpiredError:
            return createError.Unauthorized()
        default:
            return createError.InternalServerError(error.message)
        }
    }
}
