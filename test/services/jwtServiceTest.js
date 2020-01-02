const chai = require('chai')
const uuidv4 = require('uuid/v4')
const safeEval = require('safe-eval')
const fs = require('fs')
const path = require('path')
const { sign } = require('jsonwebtoken')
const config = require('../../src/config')
const { sequelize } = require('../../src/models/dao')
const { createUser } = require('../../src/services/userService')
const { createJwt, verifyJWT, destroyJwt } = require('../../src/services/jwtService')
const {
    NotFoundError,
    NotNullViolationError,
    JWTMalformedError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-uuid'))
chai.use(require('chai-jwt'))
chai.use(require('chai-date-string'))

const USERNAME = 'User1'
const PASSWORD = 'pass123'
const AUTHORITIES = ['TEST1', 'TEST2']
const UNKNOWN_USER_ID = uuidv4()

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

describe('JwtService', () => {
    let someUserId, someJwt, someToken

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            .then(() => createUser({ username: USERNAME, password: PASSWORD }).then(user => { someUserId = user.id }))
            .then(() => { someToken = sign({ foo: 'bar' }, 'shhhhh') })
            .should.notify(done)
    })

    describe('Create Jwt', () => {
        it('should create a new jwt', done => {
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.fulfilled
                .then(jwt => {
                    jwt.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                    jwt.should.have.property('id').to.be.a.uuid('v4')
                    jwt.should.have.property('userId').to.be.a.uuid('v4').and.to.equal(someUserId)
                    /* eslint-disable-next-line */
                    jwt.should.have.property('token').and.to.be.a.jwt
                    jwt.should.have.property('createdAt').to.be.a.dateString()
                    jwt.should.have.property('updatedAt').to.be.a.dateString()
                    someJwt = jwt
                })
                .should.notify(done)
        })

        it('should create a new jwt with empty authorities', done => {
            createJwt({ userId: someUserId, authorities: [] }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.fulfilled
                .then(jwt => {
                    jwt.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                    jwt.should.have.property('id').to.be.a.uuid('v4')
                    jwt.should.have.property('userId').to.be.a.uuid('v4').and.to.equal(someUserId)
                    /* eslint-disable-next-line */
                    jwt.should.have.property('token').and.to.be.a.jwt
                    jwt.should.have.property('createdAt').to.be.a.dateString()
                    jwt.should.have.property('updatedAt').to.be.a.dateString()
                })
                .should.notify(done)
        })

        it('should not create a new jwt with an unknown user id', done => {
            createJwt({ userId: UNKNOWN_USER_ID, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.rejectedWith(NotFoundError, `User.id = ${UNKNOWN_USER_ID} was not found.`)
                .and.notify(done)
        })

        it('should not create a new jwt with a user id of null', done => {
            createJwt({ userId: null, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with a authorities of null', done => {
            createJwt({ userId: someUserId, authorities: null }, JWT_SIGNING_SECRET, JWT_SIGNING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'authorities cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with secret of null', done => {
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, null, JWT_SIGNING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'secret cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of null', done => {
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, null)
                .should.be.rejectedWith(NotNullViolationError, 'options cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of algorithm of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            delete options.algorithm
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'algorithm cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of issuer of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            delete options.issuer
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'issuer cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of audience of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            delete options.audience
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'audience cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of subject of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            delete options.subject
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'subject cannot be null.')
                .and.notify(done)
        })

        it('should not create a new jwt with options of expiresIn of null', done => {
            const options = Object.assign({}, JWT_SIGNING_OPTIONS)
            delete options.expiresIn
            createJwt({ userId: someUserId, authorities: AUTHORITIES }, JWT_SIGNING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'expiresIn cannot be null.')
                .and.notify(done)
        })
    })

    describe('Verify an Jwt', () => {
        it('should verify an JWT using token and options', done => {
            verifyJWT(someJwt.token, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.fulfilled
                .should.notify(done)
        })

        it('should not verify an jwt with an invalid token', done => {
            verifyJWT(someToken, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                .and.notify(done)
        })

        it('should not verify an jwt with a token of null', done => {
            verifyJWT(null, JWT_VERIFYING_SECRET, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'token cannot be null.')
                .and.notify(done)
        })

        it('should not verify an jwt with secret of null', done => {
            verifyJWT(someJwt.token, null, JWT_VERIFYING_OPTIONS)
                .should.be.rejectedWith(NotNullViolationError, 'secret cannot be null.')
                .and.notify(done)
        })

        it('should not verify an jwt with options of null', done => {
            verifyJWT(someJwt.token, JWT_VERIFYING_SECRET, null)
                .should.be.rejectedWith(NotNullViolationError, 'options cannot be null.')
                .and.notify(done)
        })

        it('should not verify an jwt with options of issuer of null', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.issuer
            verifyJWT(someJwt.token, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'issuer cannot be null.')
                .and.notify(done)
        })

        it('should not verify an jwt with options of audience of null', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.audience
            verifyJWT(someJwt.token, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'audience cannot be null.')
                .and.notify(done)
        })

        it('should not verify an jwt with options of subject of null', done => {
            const options = Object.assign({}, JWT_VERIFYING_OPTIONS)
            delete options.subject
            verifyJWT(someJwt.token, JWT_VERIFYING_SECRET, options)
                .should.be.rejectedWith(NotNullViolationError, 'subject cannot be null.')
                .and.notify(done)
        })
    })

    describe('Destroy an Jwt', () => {
        it('should destroy an jwt by id', done => {
            destroyJwt(someJwt.id)
                .should.be.fulfilled
                .then(jwt => jwt.should.eql(someJwt))
                .should.notify(done)
        })

        it('should not destroy an jwt by id of null', done => {
            destroyJwt(null)
                .should.be.rejectedWith(NotNullViolationError, 'jwtId cannot be null.')
                .and.notify(done)
        })

        it('should not destroy an jwt by id of null', done => {
            const unknownId = uuidv4()
            destroyJwt(unknownId)
                .should.be.rejectedWith(NotFoundError, `Jwt.id = ${unknownId} was not found.`)
                .and.notify(done)
        })
    })
})
