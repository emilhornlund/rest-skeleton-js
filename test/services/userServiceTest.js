const chai = require('chai')
const uuidv4 = require('uuid/v4')
const { sequelize } = require('../../src/models/dao')
const {
    findAllUsers,
    createUser,
    findUserById,
    findUserByUsername,
    updateUserById,
    deleteUserById
} = require('../../src/services/userService')
const {
    NotNullViolationError,
    NotUniqueError,
    NotFoundError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))

const DEFAULT_USER_PREFIX = 'User'
const DEFAULT_USER_PASSWORD = 'pass123'
const NUMBER_OF_USERS = 5
const UNKNOWN_USER_ID = uuidv4()

describe('UserService', () => {
    let someUserId, someUsername

    before(done => sequelize.sync({ force: true }).should.be.fulfilled.should.notify(done))

    describe('Create new users', () => {
        it(`should create ${NUMBER_OF_USERS} new users`, done => {
            Promise.all((n => [...Array(n).keys()].map(i => createUser({ username: DEFAULT_USER_PREFIX + (i + 1), password: DEFAULT_USER_PASSWORD })))(NUMBER_OF_USERS))
                .should.be.fulfilled
                .then(users => {
                    users.should.be.an('array').and.be.of.length(NUMBER_OF_USERS)
                    users.forEach((user, i) => {
                        user.should.be.a('object').and.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                        user.should.have.property('id').to.be.a.uuid('v4')
                        user.should.have.property('username').to.be.a('string').and.equal(`${DEFAULT_USER_PREFIX}${i + 1}`)
                        user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                        user.should.have.property('createdAt').to.be.a.dateString().and.eql(user.updatedAt)
                        user.should.have.property('updatedAt').to.be.a.dateString().and.eql(user.createdAt)
                    })
                    const lastUser = users[(NUMBER_OF_USERS - 1)]
                    someUserId = lastUser.id
                    someUsername = lastUser.username
                })
                .should.notify(done)
        })

        const USERNAME = DEFAULT_USER_PREFIX + NUMBER_OF_USERS

        it('should not create a new user with data of null', done => {
            createUser(null)
                .should.be.rejectedWith(NotNullViolationError, 'data cannot be null.')
                .and.notify(done)
        })

        it('should not create a new user with a username of null', done => {
            createUser({ username: null, password: DEFAULT_USER_PASSWORD })
                .should.be.rejectedWith(NotNullViolationError, 'username cannot be null.')
                .and.notify(done)
        })

        it('should not create a new user with a password of null', done => {
            createUser({ username: USERNAME, password: null })
                .should.be.rejectedWith(NotNullViolationError, 'password cannot be null.')
                .and.notify(done)
        })

        it('should not create a new user with a non unique username', done => {
            const USERNAME = DEFAULT_USER_PREFIX + NUMBER_OF_USERS
            createUser({ username: USERNAME, password: DEFAULT_USER_PASSWORD })
                .should.be.rejectedWith(NotUniqueError, `User.username = ${USERNAME} must be unique.`)
                .and.notify(done)
        })
    })

    describe('Find all users', () => {
        it(`should find a list of ${NUMBER_OF_USERS} users`, done => {
            findAllUsers()
                .should.be.fulfilled
                .then(users => {
                    users.should.be.an('array').and.have.length(NUMBER_OF_USERS)
                    users.forEach((user, i) => {
                        user.should.be.a('object').and.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                        user.should.have.property('id').to.be.a.uuid('v4')
                        user.should.have.property('username').to.be.a('string').and.equal(`${DEFAULT_USER_PREFIX}${i + 1}`)
                        user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                        user.should.have.property('createdAt').to.be.a.dateString().and.eql(user.updatedAt)
                        user.should.have.property('updatedAt').to.be.a.dateString().and.eql(user.createdAt)
                    })
                })
                .should.notify(done)
        })
    })

    describe('Find a user', () => {
        it('should find a user by id', done => {
            findUserById(someUserId)
                .should.be.fulfilled
                .then(user => {
                    user.should.be.a('object').and.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                    user.should.have.property('id').to.be.a.uuid('v4').and.equal(someUserId)
                    user.should.have.property('username').to.be.a('string').and.equal(someUsername)
                    user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                    user.should.have.property('createdAt').to.be.a.dateString().and.eql(user.updatedAt)
                    user.should.have.property('updatedAt').to.be.a.dateString().and.eql(user.createdAt)
                })
                .should.notify(done)
        })

        it('should not find a user by an incorrect id', done => {
            findUserById(UNKNOWN_USER_ID)
                .should.be.rejectedWith(NotFoundError, `User.id = ${UNKNOWN_USER_ID} was not found.`)
                .and.notify(done)
        })

        const UNKNOWN_USERNAME = `${DEFAULT_USER_PREFIX}0`

        it('should not find a user by an id of null', done => {
            findUserById(null)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .and.notify(done)
        })

        it('should find a user by username', done => {
            findUserByUsername(someUsername)
                .should.be.fulfilled
                .then(user => {
                    user.should.be.a('object').and.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                    user.should.have.property('id').to.be.a.uuid('v4').and.equal(someUserId)
                    user.should.have.property('username').to.be.a('string').and.equal(someUsername)
                    user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                    user.should.have.property('createdAt').to.be.a.dateString().and.eql(user.updatedAt)
                    user.should.have.property('updatedAt').to.be.a.dateString().and.eql(user.createdAt)
                })
                .should.notify(done)
        })

        it('should not find a user by an unknown username', done => {
            findUserByUsername(UNKNOWN_USERNAME)
                .should.be.rejectedWith(NotFoundError, `User.username = ${UNKNOWN_USERNAME} was not found.`)
                .and.notify(done)
        })

        it('should not find a user by a username of null', done => {
            findUserByUsername(null)
                .should.be.rejectedWith(NotNullViolationError, 'username cannot be null.')
                .and.notify(done)
        })
    })

    describe('Update a user', () => {
        const NONUNIQUE_USERNAME = `${DEFAULT_USER_PREFIX}1`

        it('should update a user by id', done => {
            someUsername = `${DEFAULT_USER_PREFIX}0`
            updateUserById(someUserId, { username: someUsername, password: DEFAULT_USER_PASSWORD })
                .should.be.fulfilled
                .then(user => {
                    user.should.be.a('object').and.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                    user.should.have.property('id').to.be.a.uuid('v4').and.equal(someUserId)
                    user.should.have.property('username').to.be.a('string').and.equal(someUsername)
                    user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                    user.should.have.property('createdAt').to.be.a.dateString().and.not.eql(user.updatedAt)
                    user.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(user.createdAt)
                })
                .should.notify(done)
        })

        it('should update a user by id and with its own username', done => {
            updateUserById(someUserId, { username: someUsername })
                .should.be.fulfilled
                .then(user => {
                    user.should.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                    user.should.have.property('id').to.be.a.uuid('v4').and.equal(someUserId)
                    user.should.have.property('username').to.be.a('string').and.equal(someUsername)
                    user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                    user.should.have.property('createdAt').to.be.a.dateString().and.not.eql(user.updatedAt)
                    user.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(user.createdAt)
                })
                .should.notify(done)
        })

        it('should not update a user by an id of null', done => {
            updateUserById(null, { username: someUsername, password: DEFAULT_USER_PASSWORD })
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .and.notify(done)
        })

        it('should not update a user by id and with data of null', done => {
            updateUserById(someUserId, null)
                .should.be.rejectedWith(NotNullViolationError, 'data cannot be null.')
                .and.notify(done)
        })

        it('should not update a user by id and with a non unique username', done => {
            updateUserById(someUserId, { username: NONUNIQUE_USERNAME })
                .should.be.rejectedWith(NotUniqueError, `User.username = ${NONUNIQUE_USERNAME} must be unique.`)
                .and.notify(done)
        })

        it('should not update a user by an unknown id', done => {
            updateUserById(UNKNOWN_USER_ID, {})
                .should.be.rejectedWith(NotFoundError, `User.id = ${UNKNOWN_USER_ID} was not found.`)
                .and.notify(done)
        })
    })

    describe('Delete a user', () => {
        it('should delete a user by id', done => {
            deleteUserById(someUserId)
                .should.be.fulfilled
                .then(user => {
                    user.should.have.all.keys('id', 'username', 'password', 'createdAt', 'updatedAt')
                    user.should.have.property('id').to.be.a.uuid('v4').and.equal(someUserId)
                    user.should.have.property('username').to.be.a('string').and.equal(someUsername)
                    user.should.have.property('password').to.be.a('string').and.not.equal(DEFAULT_USER_PASSWORD)
                    user.should.have.property('createdAt').to.be.a.dateString().and.not.eql(user.updatedAt)
                    user.should.have.property('updatedAt').to.be.a.dateString().and.not.eql(user.createdAt)
                })
                .should.notify(done)
        })

        it('should not delete a user by an unknown id', done => {
            deleteUserById(UNKNOWN_USER_ID)
                .should.be.rejectedWith(NotFoundError, `User.id = ${UNKNOWN_USER_ID} was not found.`)
                .and.notify(done)
        })

        it('should not delete a user by an id of null', done => {
            updateUserById(null)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .and.notify(done)
        })
    })
})
