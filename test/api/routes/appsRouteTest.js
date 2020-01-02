const chai = require('chai')
const uuidv4 = require('uuid/v4')
const app = require('../../../src/app')
const { sequelize } = require('../../../src/models/dao')
const { createUser } = require('../../../src/services/userService')
const { createApp } = require('../../../src/services/appService')
const { authenticateUserById } = require('../../../src/services/authService')
const { addAuthoritiesToUserById } = require('../../../src/services/authorityService')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-http'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))

const USERNAME_PREFIX = 'User'
const PASSWORD = 'pass123'
const AUTHORITIES = ['APP_MANAGEMENT']
const APP_NAME_PREFIX = 'MyApp'

describe('AppsRoute', () => {
    let mockedAuth, mockedAuthNonAuthority, mockedApp

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            /* Create first user with authorities */
            .then(() => createUser({ username: `${USERNAME_PREFIX}1`, password: PASSWORD }))
            .then(user => addAuthoritiesToUserById(AUTHORITIES, user.id)
                .then(() => authenticateUserById(user.id))
                .then(auth => { mockedAuth = auth }))
            /* Create second user without authorities */
            .then(() => createUser({ username: `${USERNAME_PREFIX}2`, password: PASSWORD })
                .then(user => authenticateUserById(user.id))
                .then(auth => { mockedAuthNonAuthority = auth }))
            /* Create 5 apps */
            .then(() => createApp({ name: `${APP_NAME_PREFIX}1` }).then(app => { mockedApp = app }))
            .then(() => createApp({ name: `${APP_NAME_PREFIX}2` }))
            .then(() => createApp({ name: `${APP_NAME_PREFIX}3` }))
            .then(() => createApp({ name: `${APP_NAME_PREFIX}4` }))
            .then(() => createApp({ name: `${APP_NAME_PREFIX}5` }))
            .should.notify(done)
    })

    describe('GET /api/v1/apps', () => {
        it('should get a list of 5 apps', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.an('array').to.have.length(5)
                    res.body.forEach(app => {
                        app.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                        app.should.have.property('id').to.be.a.uuid('v4')
                        app.should.have.property('name').to.be.a('string')
                        app.should.have.property('created_at').to.be.a.dateString().and.to.eql(app.updated_at)
                        app.should.have.property('updated_at').to.be.a.dateString().and.to.eql(app.created_at)
                    })
                    done(err)
                })
        })

        it('should not get a list of 5 apps without an API-key', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not get a list of 5 apps with an invalid API-key', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not get a list of 5 apps without an auth token', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not get a list of 5 apps with an invalid auth token', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not get a list of 5 apps without valid authority', done => {
            chai.request(app)
                .get('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuthNonAuthority.authToken.token)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    let createdAppResponse

    describe('POST /api/v1/apps', () => {
        it('should create an app', done => {
            const name = 'MyApp'
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(201)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4')
                    res.body.should.have.property('name').to.be.a('string').and.to.equal(name)
                    res.body.should.have.property('created_at').to.be.a.dateString().and.to.eql(res.body.updated_at)
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.to.eql(res.body.created_at)
                    createdAppResponse = res.body
                    done(err)
                })
        })

        it('should create an app with a non unique name', done => {
            const name = `${APP_NAME_PREFIX}6`
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(201)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4')
                    res.body.should.have.property('name').to.be.a('string').and.to.equal(name)
                    res.body.should.have.property('created_at').to.be.a.dateString().and.to.eql(res.body.updated_at)
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.to.eql(res.body.created_at)
                    done(err)
                })
        })

        it('should not create an app without a name', done => {
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({})
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'name cannot be null.')
                    done(err)
                })
        })

        it('should not create an app without an API-key', done => {
            chai.request(app)
                .post('/api/v1/apps')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create an app with an invalid API-key', done => {
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create an app without an auth token', done => {
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not create an app with an invalid auth token', done => {
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create an app without valid authority', done => {
            const name = 'MyApp'
            chai.request(app)
                .post('/api/v1/apps')
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuthNonAuthority.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('GET /api/v1/apps/:appId', () => {
        it('should find an app', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.deep.equal(createdAppResponse)
                    done(err)
                })
        })

        it('should not find an app with an unknown app id', done => {
            const appId = uuidv4()
            chai.request(app)
                .get('/api/v1/apps/' + appId)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `App.id = ${appId} was not found.`)
                    done(err)
                })
        })

        it('should not find an app without an API-key', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find an app with an invalid API-key', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find an app without an auth token', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not find an app with an invalid auth token', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find an app without valid authority', done => {
            chai.request(app)
                .get('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuthNonAuthority.authToken.token)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('PATCH /api/v1/apps/:appId', () => {
        it('should update an app', done => {
            const name = `${APP_NAME_PREFIX}7`
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(createdAppResponse.id)
                    res.body.should.have.property('name').to.be.a('string').and.to.equal(name)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.not.to.equal(res.body.created_at)
                    createdAppResponse = res.body
                    done(err)
                })
        })

        it('should update an app with the same name', done => {
            const name = `${APP_NAME_PREFIX}7`
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(createdAppResponse.id)
                    res.body.should.have.property('name').to.be.a('string').and.to.equal(createdAppResponse.name)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.not.to.equal(res.body.created_at)
                    createdAppResponse = res.body
                    done(err)
                })
        })

        it('should update an app without a name', done => {
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(createdAppResponse.id)
                    res.body.should.have.property('name').to.be.a('string').and.to.equal(createdAppResponse.name)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.not.to.equal(res.body.created_at)
                    createdAppResponse = res.body
                    done(err)
                })
        })

        it('should not update an app with an unknown app id', done => {
            const appId = uuidv4()
            chai.request(app)
                .patch('/api/v1/apps/' + appId)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .send({ name: 'MyApp' })
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `App.id = ${appId} was not found.`)
                    done(err)
                })
        })

        it('should not update an app without an API-key', done => {
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update an app with an invalid API-key', done => {
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update an app without an auth token', done => {
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not update an app with an invalid auth token', done => {
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update an app without valid authority', done => {
            const name = `${APP_NAME_PREFIX}7`
            chai.request(app)
                .patch('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuthNonAuthority.authToken.token)
                .send({ name })
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('DELETE /api/v1/apps/:appId', () => {
        it('should delete an app', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.deep.equal(createdAppResponse)
                    done(err)
                })
        })

        it('should not delete an app with an unknown app id', done => {
            const appId = uuidv4()
            chai.request(app)
                .delete('/api/v1/apps/' + appId)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuth.authToken.token)
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `App.id = ${appId} was not found.`)
                    done(err)
                })
        })

        it('should not delete an app without an API-key', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete an app with an invalid API-key', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete an app without an auth token', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not delete an app with an invalid auth token', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete an app without valid authority', done => {
            chai.request(app)
                .delete('/api/v1/apps/' + createdAppResponse.id)
                .set('X-API-Key', mockedApp.key)
                .set('X-Auth-Token', mockedAuthNonAuthority.authToken.token)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })
})
