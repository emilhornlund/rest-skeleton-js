const chai = require('chai')
const uuidv4 = require('uuid/v4')
const { sequelize } = require('../../src/models/dao')
const { createUser } = require('../../src/services/userService')
const {
    authenticateUserById,
    authenticateUserByUsernameAndPassword,
    authenticateUserWithRefreshToken
} = require('../../src/services/authService')
const { addAuthoritiesToUserById } = require('../../src/services/authorityService')
const {
    NotFoundError,
    NotNullViolationError,
    BadCredentialsError,
    JWTMalformedError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-uuid'))
chai.use(require('chai-jwt'))
chai.use(require('chai-date-string'))

const USERNAME = 'User1'
const PASSWORD = 'pass123'
const UNKNOWN_USER_ID = uuidv4()
const UNKNOWN_USERNAME = 'User2'
const UNKNOWN_PASSWORD = '123pass'
const AUTHORITIES = ['TEST1', 'TEST2']

describe('AuthService', () => {
    let someUserId, someJwt

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            .then(() => createUser({ username: USERNAME, password: PASSWORD }).then(user => { someUserId = user.id }))
            .then(() => addAuthoritiesToUserById(AUTHORITIES, someUserId))
            .should.notify(done)
    })

    describe('Authenticate', () => {
        describe('Using user id', () => {
            it('should authenticate a user using a user id', done => {
                authenticateUserById(someUserId)
                    .should.be.fulfilled
                    .then(auth => {
                        auth.authToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.authToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.refreshToken.id)
                        auth.authToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.refreshToken.token)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.authToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.authToken.should.have.property('updatedAt').to.be.a.dateString()

                        auth.refreshToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.refreshToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.authToken.id)
                        auth.refreshToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.authToken.token)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.refreshToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.refreshToken.should.have.property('updatedAt').to.be.a.dateString()
                        someJwt = auth
                    })
                    .should.notify(done)
            })

            it('should not authenticate a user using a unknown user id', done => {
                authenticateUserById(UNKNOWN_USER_ID)
                    .should.be.rejectedWith(NotFoundError, `User.id = ${UNKNOWN_USER_ID} was not found.`)
                    .and.notify(done)
            })

            it('should not authenticate a user using a user id of null', done => {
                authenticateUserById(null)
                    .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                    .and.notify(done)
            })
        })

        describe('Using username and password', () => {
            it('should authenticate a user using a username and password', done => {
                authenticateUserByUsernameAndPassword(USERNAME, PASSWORD)
                    .should.be.fulfilled
                    .then(auth => {
                        auth.authToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.authToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.refreshToken.id)
                        auth.authToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.refreshToken.token)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.authToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.authToken.should.have.property('updatedAt').to.be.a.dateString()

                        auth.refreshToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.refreshToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.authToken.id)
                        auth.refreshToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.authToken.token)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.refreshToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.refreshToken.should.have.property('updatedAt').to.be.a.dateString()
                    })
                    .should.notify(done)
            })

            it('should not authenticate a user using a username and password when username is unknown', done => {
                authenticateUserByUsernameAndPassword(UNKNOWN_USERNAME, PASSWORD)
                    .should.be.rejectedWith(BadCredentialsError, `Bad credentials of user ${UNKNOWN_USERNAME}.`)
                    .and.notify(done)
            })

            it('should not authenticate a user using a username and password when password is unknown', done => {
                authenticateUserByUsernameAndPassword(USERNAME, UNKNOWN_PASSWORD)
                    .should.be.rejectedWith(BadCredentialsError, `Bad credentials of user ${USERNAME}.`)
                    .and.notify(done)
            })

            it('should not authenticate a user using a username and password when username is null', done => {
                authenticateUserByUsernameAndPassword(null, PASSWORD)
                    .should.be.rejectedWith(NotNullViolationError, 'username cannot be null.')
                    .and.notify(done)
            })

            it('should not authenticate a user using a username and password when password is null', done => {
                authenticateUserByUsernameAndPassword(USERNAME, null)
                    .should.be.rejectedWith(NotNullViolationError, 'password cannot be null.')
                    .and.notify(done)
            })
        })

        describe('Using refresh token', () => {
            it('should authenticate a user using a refresh token', done => {
                authenticateUserWithRefreshToken(someJwt.refreshToken.token)
                    .should.be.fulfilled
                    .then(auth => {
                        auth.authToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.authToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.refreshToken.id)
                        auth.authToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.refreshToken.token)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.authToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.authToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.authToken.should.have.property('updatedAt').to.be.a.dateString()

                        auth.refreshToken.should.be.a('object').and.have.all.keys('id', 'userId', 'token', 'authorities', 'createdAt', 'updatedAt')
                        auth.refreshToken.should.have.property('id').to.be.a.uuid('v4').and.not.equal(auth.authToken.id)
                        auth.refreshToken.should.have.property('userId').to.be.a.uuid('v4').and.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.not.equal(auth.authToken.token)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.userId').to.equal(someUserId)
                        auth.refreshToken.should.have.property('token').to.be.a.jwt.and.to.have.nested.property('payload.authorities').to.eql(AUTHORITIES)
                        auth.refreshToken.should.have.property('createdAt').to.be.a.dateString()
                        auth.refreshToken.should.have.property('updatedAt').to.be.a.dateString()
                    })
                    .should.notify(done)
            })

            it('should not authenticate a user using a refresh token when the refresh token is null', done => {
                authenticateUserWithRefreshToken(null)
                    .should.be.rejectedWith(NotNullViolationError, 'refreshToken cannot be null.')
                    .and.notify(done)
            })

            it('should not authenticate a user using a auth token', done => {
                authenticateUserWithRefreshToken(someJwt.authToken.token)
                    .should.be.rejectedWith(JWTMalformedError, 'JWT is malformed.')
                    .and.notify(done)
            })

            it('should authenticate a user using a refresh token', done => {
                authenticateUserWithRefreshToken(someJwt.refreshToken.token)
                    .should.be.rejected.and.notify(done)
            })
        })
    })
})
