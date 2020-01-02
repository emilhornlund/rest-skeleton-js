const chai = require('chai')
const { sign } = require('jsonwebtoken')
const uuidv4 = require('uuid/v4')
const safeEval = require('safe-eval')
const fs = require('fs')
const path = require('path')
const config = require('../../src/config')
const {
    randomBytes,
    hashPassword,
    verifyHashPassword,
    signJWT,
    verifyJWT
} = require('../../src/helpers/security')
const {
    JWTExpiredError,
    JWTMalformedError,
    NotNullViolationError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-jwt'))

const PASSWORD = 'pass123'
const USER_ID = uuidv4()
const AUTHORITIES = ['AUTHORITY_1', 'AUTHORITY_2']
const JWT_ID = uuidv4()

const JWT_SIGNING_SECRET = fs.readFileSync(path.resolve(__dirname, '../../', config.jwt.privateKey), 'utf8')
const JWT_SIGNING_OPTIONS = {
    algorithm: config.jwt.algorithm,
    issuer: config.jwt.issuer,
    subject: 'auth',
    audience: config.jwt.audience,
    expiresIn: safeEval(config.jwt.auth.expiresIn)
}

const JWT_VERIFYING_SECRET = fs.readFileSync(path.resolve(__dirname, '../../', config.jwt.publicKey), 'utf8')
const JWT_VERIFYING_OPTIONS = {
    issuer: config.jwt.issuer,
    subject: 'auth',
    audience: config.jwt.audience
}

describe('SecurityHelper', () => {
    describe('Password hasing', () => {
        it('should get random byte hex string', done => {
            randomBytes(16).should.have.length(32)
            done()
        })

        let hashedPassword

        it('should hash a password', done => {
            hashedPassword = hashPassword(PASSWORD)
            hashedPassword.should.not.be.empty.and.not.eql(PASSWORD)
            done()
        })

        it('should verify a hashed password', done => {
            verifyHashPassword(PASSWORD, hashedPassword).should.equal(true)
            done()
        })
    })

    let signedToken

    describe('Sign JWT', () => {
        it('should sign a JWT', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.fulfilled
                .then(jwt => {
                    jwt.should.be.a.jwt.to.deep.include({
                        payload: {
                            authorities: AUTHORITIES,
                            userId: USER_ID
                        },
                        iss: JWT_SIGNING_OPTIONS.issuer,
                        sub: JWT_SIGNING_OPTIONS.subject,
                        aud: JWT_SIGNING_OPTIONS.audience,
                        jti: JWT_ID
                    })
                    signedToken = jwt
                })
                .should.notify(done)
        })

        it('should not sign a JWT with payload of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            signJWT(null, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'payload cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing user id', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            signJWT({ authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing authorities', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            signJWT({ userId: USER_ID }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'authorities cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with null secret', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, null, options)
                .should.be.rejectedWith(NotNullViolationError, 'secret cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with null options', done => {
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, null)
                .should.be.rejectedWith(NotNullViolationError, 'options cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing algorithm', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            delete options.algorithm
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'algorithm cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing issuer', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            delete options.issuer
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'issuer cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing subject', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            delete options.subject
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'subject cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing audience', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            delete options.audience
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'audience cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing expiration', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            options.jwtid = JWT_ID
            delete options.expiresIn
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'expiresIn cannot be null.')
                .and.notify(done)
        })

        it('should not sign a JWT with missing jwt id', done => {
            signJWT({ userId: USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'jwtid cannot be null.')
                .and.notify(done)
        })
    })

    describe('Verify JWT', () => {
        it('should verify a JWT', done => {
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.fulfilled
                .then(decoded => {
                    decoded.should.deep.include({
                        payload: {
                            authorities: AUTHORITIES,
                            userId: USER_ID
                        },
                        iss: JWT_VERIFYING_OPTIONS.issuer,
                        sub: JWT_VERIFYING_OPTIONS.subject,
                        aud: JWT_VERIFYING_OPTIONS.audience,
                        jti: JWT_ID
                    })
                })
                .should.notify(done)
        })

        it('should not verify a JWT with a missing token', done => {
            verifyJWT(null, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'token cannot be null.')
                .and.notify(done)
        })

        it('should not verify a JWT with missing secret', done => {
            verifyJWT(signedToken, null, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'secret cannot be null.')
                .and.notify(done)
        })

        it('should not verify a JWT with missing options', done => {
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, null)
                .should.be.rejectedWith(NotNullViolationError, 'options cannot be null.')
                .and.notify(done)
        })

        it('should not verify a JWT with options missing issuer', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.issuer
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'issuer cannot be null.')
                .and.notify(done)
        })

        it('should not verify a JWT with options missing subject', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.subject
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'subject cannot be null.')
                .and.notify(done)
        })

        it('should not verify a JWT with options missing audience', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.audience
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'audience cannot be null.')
                .and.notify(done)
        })

        const JWT_MANUAL_SIGN_OPTIONS = {
            algorithm: 'RS512',
            issuer: 'rest-skeleton-js',
            subject: 'auth',
            audience: 'test',
            expiresIn: 30,
            jwtid: JWT_ID
        }

        it('should verify a manually signed JWT', done => {
            const signedToken = sign({ payload: { userId: USER_ID, authorities: AUTHORITIES } }, JWT_SIGNING_SECRET, JWT_MANUAL_SIGN_OPTIONS)
            verifyJWT(signedToken, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.fulfilled
                .then(decoded => {
                    decoded.should.deep.include({
                        payload: {
                            authorities: AUTHORITIES,
                            userId: USER_ID
                        },
                        iss: JWT_MANUAL_SIGN_OPTIONS.issuer,
                        sub: JWT_MANUAL_SIGN_OPTIONS.subject,
                        aud: JWT_MANUAL_SIGN_OPTIONS.audience,
                        jti: JWT_MANUAL_SIGN_OPTIONS.jwtid
                    })
                })
                .should.notify(done)
        })

        it('should not verify a JWT with token missing payload', done => {
            const token = sign({}, JWT_SIGNING_SECRET, JWT_MANUAL_SIGN_OPTIONS)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify a JWT with token missing user id', done => {
            const token = sign({ payload: { authorities: AUTHORITIES } }, JWT_SIGNING_SECRET, JWT_MANUAL_SIGN_OPTIONS)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify a JWT with token missing authorities', done => {
            const token = sign({ payload: { userId: USER_ID } }, JWT_SIGNING_SECRET, JWT_MANUAL_SIGN_OPTIONS)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify a JWT with token missing audience', done => {
            const options = Object.assign({}, JWT_MANUAL_SIGN_OPTIONS)
            delete options.audience
            const token = sign({ payload: { userId: USER_ID, authorities: AUTHORITIES } }, JWT_SIGNING_SECRET, options)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify a JWT with token missing issuer', done => {
            const options = Object.assign({}, JWT_MANUAL_SIGN_OPTIONS)
            delete options.issuer
            const token = sign({ payload: { userId: USER_ID, authorities: AUTHORITIES } }, JWT_SIGNING_SECRET, options)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify a JWT with token missing jwt id', done => {
            const options = Object.assign({}, JWT_MANUAL_SIGN_OPTIONS)
            delete options.jwtid
            const token = sign({ payload: { userId: USER_ID, authorities: AUTHORITIES } }, JWT_SIGNING_SECRET, options)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify an expired JWT', done => {
            const options = Object.assign({}, JWT_MANUAL_SIGN_OPTIONS)
            delete options.expiresIn
            const token = sign({ payload: { userId: USER_ID, authorities: AUTHORITIES }, exp: Math.floor(Date.now() / 1000) - 30 }, JWT_SIGNING_SECRET, options)
            verifyJWT(token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTExpiredError, 'JWT has expired.')
                .and.notify(done)
        })
    })
})
