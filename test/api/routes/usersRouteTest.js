const chai = require('chai')
const uuidv4 = require('uuid/v4')
const app = require('../../../src/app')
const { sequelize } = require('../../../src/models/dao')
const { createApp } = require('../../../src/services/appService')
const { createUser } = require('../../../src/services/userService')
const { addAuthoritiesToUserById } = require('../../../src/services/authorityService')
const { authenticateUserById } = require('../../../src/services/authService')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-http'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))

const USERNAME_PREFIX = 'User'
const PASSWORD = 'pass123'
const AUTHORITIES = ['USER_MANAGEMENT']
const NEW_AUTHORITIES = ['TEST_AUTHORITY_1', 'TEST_AUTHORITY_2']
const APP_NAME_PREFIX = 'MyApp'

describe('UsersRoute', () => {
    let mockedApiKey, mockedAuthToken, mockedSecondAuthToken, primaryUserId, secondaryUserId

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            /* create app */
            .then(() => createApp({ name: `${APP_NAME_PREFIX}1` })
                .then(app => { mockedApiKey = app.key }))
            /* create primary user */
            .then(() => createUser({ username: `${USERNAME_PREFIX}1`, password: PASSWORD })
                .then(user => addAuthoritiesToUserById(AUTHORITIES, user.id)
                    .then(() => authenticateUserById(user.id))
                    .then(auth => { mockedAuthToken = auth.authToken.token })
                    .then(() => { primaryUserId = user.id })))
            /* create secondary user without authorities */
            .then(() => createUser({ username: `${USERNAME_PREFIX}2`, password: PASSWORD })
                .then(user => authenticateUserById(user.id)
                    .then(auth => { mockedSecondAuthToken = auth.authToken.token })
                    .then(() => { secondaryUserId = user.id })))
            /* create 3 more users */
            .then(() => createUser({ username: `${USERNAME_PREFIX}3`, password: PASSWORD }))
            .then(() => createUser({ username: `${USERNAME_PREFIX}4`, password: PASSWORD }))
            .then(() => createUser({ username: `${USERNAME_PREFIX}5`, password: PASSWORD }))
            .should.notify(done)
    })

    describe('GET /api/v1/users', () => {
        it('should find a list of 5 users', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.an('array').to.have.length(5)
                    res.body.forEach((user, i) => {
                        user.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                        user.should.have.property('id').to.be.a.uuid('v4')
                        user.should.have.property('username').to.be.a('string').and.to.equal(`${USERNAME_PREFIX + (i + 1)}`)
                        user.should.have.property('created_at').to.be.a.dateString()
                        user.should.have.property('updated_at').to.be.a.dateString().and.to.equal(user.created_at)
                    })
                    done(err)
                })
        })

        it('should not find a list of 5 users without an API-key', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a list of 5 users with an invalid API-key', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-API-Key', 'invalid-api-key')
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a list of 5 users without an auth token', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not find a list of 5 users with an invalid auth token', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a list of 5 users without valid authority', done => {
            chai.request(app)
                .get('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedSecondAuthToken)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    const CREATE_USERNAME = `${USERNAME_PREFIX}6`
    let workingUserResponse

    describe('POST /api/v1/users', () => {
        it('should create a user', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(201)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4')
                    res.body.should.have.property('username').to.be.a('string').and.to.equal(CREATE_USERNAME)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.to.equal(res.body.created_at)
                    workingUserResponse = res.body
                    done(err)
                })
        })

        it('should not create a user without a username', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'username cannot be null.')
                    done(err)
                })
        })

        it('should not create a user without a password', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: CREATE_USERNAME })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'password cannot be null.')
                    done(err)
                })
        })

        it('should not create a user with a non unique username', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `User.username = ${CREATE_USERNAME} must be unique.`)
                    done(err)
                })
        })

        it('should not create a user without an API-key', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create a user with an invalid API-key', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', 'invalid-api-key')
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create a user without an auth token', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not create a user with an invalid auth token', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', 'invalid_auth_token')
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not create a user without valid authority', done => {
            chai.request(app)
                .post('/api/v1/users')
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedSecondAuthToken)
                .send({ username: CREATE_USERNAME, password: PASSWORD })
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('GET /api/v1/users/:userId', () => {
        it('should find a user', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                    res.body.should.eql(workingUserResponse)
                    done(err)
                })
        })

        it('should not find a user with an unknown user id', done => {
            const userId = uuidv4()
            chai.request(app)
                .get('/api/v1/users/' + userId)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `User.id = ${userId} was not found.`)
                    done(err)
                })
        })

        it('should not find a user without an API-key', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a user with an invalid API-key', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a user without an auth token', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not find a user with an invalid auth token', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not find a user without valid authority', done => {
            chai.request(app)
                .get('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedSecondAuthToken)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    const UPDATE_USERNAME = `${USERNAME_PREFIX}7`
    const UPDATE_USERNAME_NONUNIQUE = `${USERNAME_PREFIX}5`

    describe('PATCH /api/v1/users/:userId', () => {
        it('should update a user', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: UPDATE_USERNAME })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(workingUserResponse.id)
                    res.body.should.have.property('username').to.be.a('string').and.to.equal(UPDATE_USERNAME)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.not.to.equal(res.body.created_at)
                    workingUserResponse = res.body
                    done(err)
                })
        })

        it('should update a user with the same username', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: UPDATE_USERNAME })
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                    res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(workingUserResponse.id)
                    res.body.should.have.property('username').to.be.a('string').and.to.equal(UPDATE_USERNAME)
                    res.body.should.have.property('created_at').to.be.a.dateString()
                    res.body.should.have.property('updated_at').to.be.a.dateString().and.not.to.equal(res.body.created_at)
                    workingUserResponse = res.body
                    done(err)
                })
        })

        it('should not update a user with a non unique username', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .send({ username: UPDATE_USERNAME_NONUNIQUE })
                .end((err, res) => {
                    res.should.have.status(400)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `User.username = ${UPDATE_USERNAME_NONUNIQUE} must be unique.`)
                    done(err)
                })
        })

        it('should not update a user with an unknown user id', done => {
            const userId = uuidv4()
            chai.request(app)
                .patch('/api/v1/users/' + userId)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `User.id = ${userId} was not found.`)
                    done(err)
                })
        })

        it('should not update a user without an API-key', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update a user with an invalid API-key', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update a user without an auth token', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not update a user with an invalid auth token', done => {
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not update a user without valid authority', done => {
            const username = 'User7'
            chai.request(app)
                .patch('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedSecondAuthToken)
                .send({ username })
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('DELETE /api/v1/users/:userId', () => {
        it('should delete a user', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(200)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('id', 'username', 'created_at', 'updated_at')
                    res.body.should.eql(workingUserResponse)
                    done(err)
                })
        })

        it('should not delete a user with an unknown user id', done => {
            const userId = uuidv4()
            chai.request(app)
                .delete('/api/v1/users/' + userId)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(404)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', `User.id = ${userId} was not found.`)
                    done(err)
                })
        })

        it('should not delete a user without an API-key', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete a user with an invalid API-key', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', 'invalid-api-key')
                .set('X-Auth-Token', mockedAuthToken)
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete a user without an auth token', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })

        it('should not delete a user with an invalid auth token', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', 'invalid_auth_token')
                .end((err, res) => {
                    res.should.have.status(401)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Unauthorized')
                    done(err)
                })
        })

        it('should not delete a user without valid authority', done => {
            chai.request(app)
                .delete('/api/v1/users/' + workingUserResponse.id)
                .set('X-API-Key', mockedApiKey)
                .set('X-Auth-Token', mockedSecondAuthToken)
                .end((err, res) => {
                    res.should.have.status(403)
                    res.body.should.be.a('object')
                    res.body.should.have.all.keys('message')
                    res.body.should.have.property('message', 'Forbidden')
                    done(err)
                })
        })
    })

    describe('Authorities', () => {
        describe('GET /api/v1/users/:userId/authorities', () => {
            it('should find all authorities for a user', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedAuthToken)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.be.an('array').to.have.length(AUTHORITIES.length)
                        res.body.forEach((authority, i) => {
                            authority.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                            authority.should.have.property('id').to.be.a.uuid('v4')
                            authority.should.have.property('name').to.be.a('string').and.to.equal(AUTHORITIES[i])
                            authority.should.have.property('created_at').to.be.a.dateString().and.to.eql(authority.updated_at)
                            authority.should.have.property('updated_at').to.be.a.dateString().and.to.eql(authority.created_at)
                        })
                        done(err)
                    })
            })

            it('should not find all authorities for an unknown user', done => {
                chai.request(app)
                    .get(`/api/v1/users/${workingUserResponse.id}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedAuthToken)
                    .end((err, res) => {
                        res.should.have.status(404)
                        done(err)
                    })
            })

            it('should not find all authorities for a user without an API-key', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-Auth-Token', mockedAuthToken)
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not find all authorities for a user with an invalid API-key', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', 'invalid-api-key')
                    .set('X-Auth-Token', mockedAuthToken)
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not find all authorities for a user without an auth token', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .end((err, res) => {
                        res.should.have.status(403)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Forbidden')
                        done(err)
                    })
            })

            it('should not find all authorities for a user with an invalid auth token', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', 'invalid_auth_token')
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not find all authorities for a user without valid authority', done => {
                chai.request(app)
                    .get(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedSecondAuthToken)
                    .end((err, res) => {
                        res.should.have.status(403)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Forbidden')
                        done(err)
                    })
            })
        })

        describe('POST /api/v1/users/:userId/authorities', () => {
            it('should give authorities to a user', done => {
                chai.request(app)
                    .post(`/api/v1/users/${secondaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(201)
                        res.body.should.be.an('array').to.have.length(NEW_AUTHORITIES.length)
                        res.body.forEach((authority, i) => {
                            authority.should.have.all.keys('id', 'name', 'created_at', 'updated_at')
                            authority.should.have.property('id').to.be.a.uuid('v4')
                            authority.should.have.property('name').to.be.a('string').and.to.equal(NEW_AUTHORITIES[i])
                            authority.should.have.property('created_at').to.be.a.dateString().and.to.eql(authority.updated_at)
                            authority.should.have.property('updated_at').to.be.a.dateString().and.to.eql(authority.created_at)
                        })
                        done(err)
                    })
            })

            it('should not give authorities to an unknown user', done => {
                chai.request(app)
                    .post(`/api/v1/users/${workingUserResponse.id}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(404)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', `User.id = ${workingUserResponse.id} was not found.`)
                        done(err)
                    })
            })

            it('should not give authorities to a user with authorities of null', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedAuthToken)
                    .send({})
                    .end((err, res) => {
                        res.should.have.status(400)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'names cannot be null.')
                        done(err)
                    })
            })

            it('should not give authorities for a user without an API-key', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-Auth-Token', mockedAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not give authorities for a user with an invalid API-key', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', 'invalid-api-key')
                    .set('X-Auth-Token', mockedAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not give authorities for a user without an auth token', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(403)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Forbidden')
                        done(err)
                    })
            })

            it('should not give authorities for a user with an invalid auth token', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', 'invalid_auth_token')
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not give authorities for a user without valid authority', done => {
                chai.request(app)
                    .post(`/api/v1/users/${primaryUserId}/authorities`)
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedSecondAuthToken)
                    .send({ names: NEW_AUTHORITIES })
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

    describe('Me', () => {
        describe('GET /api/users/me', () => {
            it('should find info about current authenticated user', done => {
                chai.request(app)
                    .get('/api/v1/users/me')
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', mockedSecondAuthToken)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('id', 'username', 'authorities', 'created_at', 'updated_at')
                        res.body.should.have.property('id').to.be.a.uuid('v4').and.to.equal(secondaryUserId)
                        res.body.should.have.property('username').to.be.a('string').and.to.equal(`${USERNAME_PREFIX}2`)
                        res.body.should.have.property('authorities').to.be.an('array').and.to.eql(NEW_AUTHORITIES)
                        res.body.should.have.property('created_at').to.be.a.dateString().and.to.equal(res.body.updated_at)
                        res.body.should.have.property('updated_at').to.be.a.dateString().and.to.equal(res.body.created_at)
                        done(err)
                    })
            })

            it('should not find info about current authenticated user without an API-key', done => {
                chai.request(app)
                    .get('/api/v1/users/me')
                    .set('X-Auth-Token', mockedSecondAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not find info about current authenticated user with an invalid API-key', done => {
                chai.request(app)
                    .get('/api/v1/users/me')
                    .set('X-API-Key', 'invalid-api-key')
                    .set('X-Auth-Token', mockedSecondAuthToken)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(401)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Unauthorized')
                        done(err)
                    })
            })

            it('should not find info about current authenticated user without an auth token', done => {
                chai.request(app)
                    .get('/api/v1/users/me')
                    .set('X-API-Key', mockedApiKey)
                    .send({ names: NEW_AUTHORITIES })
                    .end((err, res) => {
                        res.should.have.status(403)
                        res.body.should.be.a('object')
                        res.body.should.have.all.keys('message')
                        res.body.should.have.property('message', 'Forbidden')
                        done(err)
                    })
            })

            it('should not find info about current authenticated user with an invalid auth token', done => {
                chai.request(app)
                    .get('/api/v1/users/me')
                    .set('X-API-Key', mockedApiKey)
                    .set('X-Auth-Token', 'invalid_auth_token')
                    .send({ names: NEW_AUTHORITIES })
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
})
