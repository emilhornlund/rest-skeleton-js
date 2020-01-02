const chai = require('chai')
const app = require('../../../src/app')
const { sequelize } = require('../../../src/models/dao')
const { createApp } = require('../../../src/services/appService')
const { createUser } = require('../../../src/services/userService')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-http'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))
chai.use(require('chai-jwt'))

const APP_NAME = 'MyApp'
const USERNAME = 'User1'
const PASSWORD = 'pass123'
const UNKNOWN_USERNAME = 'User2'
const UNKNOWN_PASSWORD = '123pass'

describe('AuthRoute', () => {
    let mockedApiKey

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            /* create primary user */
            .then(() => createUser({ username: USERNAME, password: PASSWORD }))
            /* create app */
            .then(() => createApp({ name: APP_NAME })
                .then(app => { mockedApiKey = app.key }))
            .should.notify(done)
    })

    let authToken, refreshToken

    describe('POST /api/v1/auth/authenticate', () => {
        it('should authenticate a user', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', mockedApiKey)
                .send({ username: USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('auth_token', 'refresh_token')
                    /* eslint-disable-next-line */
                    res.body.should.have.property('auth_token').to.be.a.jwt
                    /* eslint-disable-next-line */
                    res.body.should.have.property('refresh_token').to.be.a.jwt
                    authToken = res.body.auth_token
                    refreshToken = res.body.refresh_token
                    done(err)
                })
        })

        it('should not authenticate a user with an unknown username', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', mockedApiKey)
                .send({ username: UNKNOWN_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `Bad credentials of user ${UNKNOWN_USERNAME}.`)
                    done(err)
                })
        })

        it('should not authenticate a user with a bad password', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', mockedApiKey)
                .send({ username: USERNAME, password: UNKNOWN_PASSWORD })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `Bad credentials of user ${USERNAME}.`)
                    done(err)
                })
        })

        it('should not authenticate a user with a username of null', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', mockedApiKey)
                .send({ password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'username cannot be null.')
                    done(err)
                })
        })

        it('should not authenticate a user with a password of null', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', mockedApiKey)
                .send({ username: USERNAME })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'password cannot be null.')
                    done(err)
                })
        })

        it('should not authenticate a user without an API-key', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not authenticate a user with an invalid API-key', done => {
            chai.request(app)
                .post('/api/v1/auth/authenticate')
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })
    })

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh a user auth', done => {
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .set('X-API-Key', mockedApiKey)
                .set('X-Refresh-Token', refreshToken)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('auth_token', 'refresh_token')
                    /* eslint-disable-next-line */
                    res.body.should.have.property('auth_token').to.be.a.jwt
                    /* eslint-disable-next-line */
                    res.body.should.have.property('refresh_token').to.be.a.jwt
                    done(err)
                })
        })

        it('should not refresh a user auth without an refresh token', done => {
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .set('X-API-Key', mockedApiKey)
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'refreshToken cannot be null.')
                    done(err)
                })
        })

        it('should not refresh a user auth with an incorrect refresh token', done => {
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .set('X-API-Key', mockedApiKey)
                .set('X-Refresh-Token', authToken)
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'JWT is malformed.')
                    done(err)
                })
        })

        it('should not refresh a user auth with a malformed JWT', done => {
            const refreshToken = 'malformed_jwt'
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .set('X-API-Key', mockedApiKey)
                .set('X-Refresh-Token', refreshToken)
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'JWT is malformed.')
                    done(err)
                })
        })

        it('should not refresh a user auth without an API-key', done => {
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not refresh a user auth with an invalid API-key', done => {
            chai.request(app)
                .post('/api/v1/auth/refresh')
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })
    })
})
