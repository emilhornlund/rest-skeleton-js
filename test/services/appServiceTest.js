const chai = require('chai')
const uuidv4 = require('uuid/v4')
const { sequelize } = require('../../src/models/dao')
const {
    findAllApps,
    createApp,
    findAppById,
    findAppByKey,
    updateAppById,
    deleteAppById
} = require('../../src/services/appService')
const {
    NotNullViolationError,
    NotFoundError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))

const DEFAULT_APP_NAME_PREFIX = 'MyApp'
const NUMBER_OF_APPS = 5
const UNKNOWN_APP_ID = uuidv4()

describe('AppService', () => {
    let someAppId, someAppName, someAppKey
    before(done => sequelize.sync({ force: true }).should.be.fulfilled.should.notify(done))

    describe('Create a new app', () => {
        it(`should create ${NUMBER_OF_APPS} new apps`, done => {
            Promise.all((n => [...Array(n).keys()].map(i => createApp({ name: DEFAULT_APP_NAME_PREFIX + (i + 1) })))(NUMBER_OF_APPS))
                .should.be.fulfilled
                .then(apps => {
                    apps.should.be.an('array').and.be.of.length(NUMBER_OF_APPS)
                    apps.forEach((app, i) => {
                        app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                        app.should.have.property('id').to.be.a.uuid('v4')
                        app.should.have.property('name').to.be.a('string').and.equal(`${DEFAULT_APP_NAME_PREFIX}${i + 1}`)
                        app.should.have.property('key').to.be.a('string')
                        app.should.have.property('createdAt').to.be.a.dateString().and.eql(app.updatedAt)
                        app.should.have.property('updatedAt').to.be.a.dateString().and.eql(app.createdAt)
                    })
                    const lastApp = apps[(NUMBER_OF_APPS - 1)]
                    someAppId = lastApp.id
                    someAppName = lastApp.name
                    someAppKey = lastApp.key
                })
                .should.notify(done)
        })

        it('should not create a new app with a data of null', done => {
            createApp(null)
                .should.be.rejectedWith(NotNullViolationError, 'data cannot be null.')
                .and.notify(done)
        })

        it('should not create a new app with a name of null', done => {
            createApp({ name: null, key: someAppKey })
                .should.be.rejectedWith(NotNullViolationError, 'name cannot be null.')
                .and.notify(done)
        })
    })

    describe('Find all apps', () => {
        it(`should find a list of ${NUMBER_OF_APPS} apps`, done => {
            findAllApps()
                .should.be.fulfilled
                .then(apps => {
                    apps.should.be.an('array').and.have.length(NUMBER_OF_APPS)
                    apps.forEach((app, i) => {
                        app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                        app.should.have.property('id').to.be.a.uuid('v4')
                        app.should.have.property('name').to.be.a('string').and.equal(`${DEFAULT_APP_NAME_PREFIX}${i + 1}`)
                        app.should.have.property('key').to.be.a('string')
                        app.should.have.property('createdAt').to.be.a.dateString().and.eql(app.updatedAt)
                        app.should.have.property('updatedAt').to.be.a.dateString().and.eql(app.createdAt)
                    })
                })
                .should.notify(done)
        })
    })

    describe('Find an app', () => {
        it('should find an app by id', done => {
            findAppById(someAppId)
                .should.be.fulfilled
                .then(app => {
                    app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                    app.should.have.property('id').to.be.a.uuid('v4').and.equal(someAppId)
                    app.should.have.property('name').to.be.a('string').and.equal(someAppName)
                    app.should.have.property('key').to.be.a('string').and.equal(someAppKey)
                    app.should.have.property('createdAt').to.be.a.dateString().and.eql(app.updatedAt)
                    app.should.have.property('updatedAt').to.be.a.dateString().and.eql(app.createdAt)
                })
                .should.notify(done)
        })

        it('should not find an app by an incorrect id', done => {
            findAppById(UNKNOWN_APP_ID)
                .should.be.rejectedWith(NotFoundError, `App.id = ${UNKNOWN_APP_ID} was not found.`)
                .and.notify(done)
        })

        it('should not find an app by an id of null', done => {
            findAppById(null)
                .should.be.rejectedWith(NotNullViolationError, 'appId cannot be null.')
                .and.notify(done)
        })

        it('should find an app by key', done => {
            findAppByKey(someAppKey)
                .should.be.fulfilled
                .then(app => {
                    app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                    app.should.have.property('id').to.be.a.uuid('v4').and.equal(someAppId)
                    app.should.have.property('name').to.be.a('string').and.equal(someAppName)
                    app.should.have.property('key').to.be.a('string').and.equal(someAppKey)
                    app.should.have.property('createdAt').to.be.a.dateString().and.eql(app.updatedAt)
                    app.should.have.property('updatedAt').to.be.a.dateString().and.eql(app.createdAt)
                })
                .should.notify(done)
        })

        it('should not find an app by an unknown key', done => {
            findAppByKey('unknown-super-secret-key')
                .should.be.rejectedWith(NotFoundError, 'App.key = ? was not found.')
                .and.notify(done)
        })

        it('should not find an app by a key of null', done => {
            findAppByKey(null)
                .should.be.rejectedWith(NotNullViolationError, 'key cannot be null.')
                .and.notify(done)
        })
    })

    describe('Update an app', () => {
        it('should update an app by id', done => {
            someAppName = `${DEFAULT_APP_NAME_PREFIX}0`
            updateAppById(someAppId, { name: someAppName })
                .should.be.fulfilled
                .then(app => {
                    app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                    app.should.have.property('id').to.be.a.uuid('v4').and.equal(someAppId)
                    app.should.have.property('name').to.be.a('string').and.equal(someAppName)
                    app.should.have.property('key').to.be.a('string').and.equal(someAppKey)
                    app.should.have.property('createdAt').to.be.a.dateString().and.not.eql(app.updatedAt)
                    app.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(app.createdAt)
                })
                .should.notify(done)
        })

        it('should update an app by id and with its own name', done => {
            updateAppById(someAppId, { name: someAppName })
                .should.be.fulfilled
                .then(app => {
                    app.should.be.a('object').and.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                    app.should.have.property('id').to.be.a.uuid('v4').and.equal(someAppId)
                    app.should.have.property('name').to.be.a('string').and.equal(someAppName)
                    app.should.have.property('key').to.be.a('string').and.equal(someAppKey)
                    app.should.have.property('createdAt').to.be.a.dateString().and.not.eql(app.updatedAt)
                    app.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(app.createdAt)
                })
                .should.notify(done)
        })

        it('should not update an app by an id of null', done => {
            updateAppById(null, { name: someAppName })
                .should.be.rejectedWith(NotNullViolationError, 'appId cannot be null.')
                .and.notify(done)
        })

        it('should not update an app by id and with data of null', done => {
            updateAppById(someAppId, null)
                .should.be.rejectedWith(NotNullViolationError, 'data cannot be null.')
                .and.notify(done)
        })

        it('should not update an app by an unknown id', done => {
            updateAppById(UNKNOWN_APP_ID, { name: someAppName })
                .should.be.rejectedWith(NotFoundError, `App.id = ${UNKNOWN_APP_ID} was not found.`)
                .and.notify(done)
        })
    })

    describe('Delete an app', () => {
        it('should delete an app by id', done => {
            deleteAppById(someAppId)
                .should.be.fulfilled
                .then(app => {
                    app.should.have.all.keys('id', 'name', 'key', 'createdAt', 'updatedAt')
                    app.should.have.property('id').to.be.a.uuid('v4').and.equal(someAppId)
                    app.should.have.property('name').to.be.a('string').and.equal(someAppName)
                    app.should.have.property('key').to.be.a('string').and.equal(someAppKey)
                    app.should.have.property('createdAt').to.be.a.dateString().and.not.eql(app.updatedAt)
                    app.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(app.createdAt)
                })
                .should.notify(done)
        })

        it('should not delete an app by an unknown id', done => {
            deleteAppById(UNKNOWN_APP_ID)
                .should.be.rejectedWith(NotFoundError, `App.id = ${UNKNOWN_APP_ID} was not found.`)
                .and.notify(done)
        })

        it('should not delete an app by an id of null', done => {
            deleteAppById(null)
                .should.be.rejectedWith(NotNullViolationError, 'appId cannot be null.')
                .and.notify(done)
        })
    })
})
