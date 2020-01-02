class DomainError extends Error {
    constructor (message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class NotFoundError extends DomainError {
    constructor (query) {
        super(`${query} was not found.`)
        this.data = { query }
    }
}

class NotUniqueError extends DomainError {
    constructor (query) {
        super(`${query} must be unique.`)
        this.data = { query }
    }
}

class NotNullViolationError extends DomainError {
    constructor (key) {
        super(`${key} cannot be null.`)
        this.data = { key }
    }
}

class BadCredentialsError extends DomainError {
    constructor (username) {
        super(`Bad credentials of user ${username}.`)
        this.data = { username }
    }
}

class JWTExpiredError extends DomainError {
    constructor (error) {
        super('JWT has expired.')
        this.data = { error }
    }
}

class JWTMalformedError extends DomainError {
    constructor (error) {
        super('JWT is malformed.')
        this.data = { error }
    }
}

class InternalError extends DomainError {
    constructor (error) {
        super(error.message)
        this.data = { error }
    }
}

module.exports = {
    DomainError,
    NotFoundError,
    NotUniqueError,
    NotNullViolationError,
    BadCredentialsError,
    JWTExpiredError,
    JWTMalformedError,
    InternalError
}
