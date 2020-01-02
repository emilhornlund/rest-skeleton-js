const chai = require('chai')
const uuidv4 = require('uuid/v4')
const { sequelize } = require('../../src/models/dao')
const {
    addAuthoritiesToUserById,
    findAllAuthoritiesByUserId
} = require('../../src/services/authorityService')
const { createUser } = require('../../src/services/userService')
const {
    NotNullViolationError,
    NotFoundError
} = require('../../src/errors')

chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('chai-uuid'))
chai.use(require('chai-date-string'))

const DEFAULT_USERNAME_PREFIX = 'User'
const DEFAULT_PASSWORD = 'pass123'

describe('AuthorityService', () => {
    let mockedUser, mockedSecondUser

    before(done => {
        sequelize.sync({ force: true })
            .should.be.fulfilled
            .then(() => createUser({ username: `${DEFAULT_USERNAME_PREFIX}1`, password: DEFAULT_PASSWORD }).then(user => { mockedUser = user }))
            .then(() => createUser({ username: `${DEFAULT_USERNAME_PREFIX}2`, password: DEFAULT_PASSWORD }).then(user => { mockedSecondUser = user }))
            .should.notify(done)
    })

    describe('Add authorities', () => {
        it('should give two authorities to a user', done => {
            addAuthoritiesToUserById(['USER1_AUTHORITY_1', 'USER1_AUTHORITY_2'], mockedUser.id)
                .should.be.fulfilled
                .then(authorities => {
                    authorities.should.be.an('array').and.have.length(2)
                    authorities.forEach((authority, i) => {
                        authority.should.have.all.keys('id', 'name', 'createdAt', 'updatedAt')
                        authority.should.have.property('id').to.be.a.uuid('v4')
                        authority.should.have.property('name').to.be.a('string').and.equal(`USER1_AUTHORITY_${i + 1}`)
                        authority.should.have.property('createdAt').to.be.a.dateString()
                        authority.should.have.property('updatedAt').to.be.a.dateString()
                    })
                })
                .should.notify(done)
        })

        it('should give two authorities to another user', done => {
            addAuthoritiesToUserById(['USER2_AUTHORITY_1', 'USER2_AUTHORITY_2'], mockedSecondUser.id)
                .should.be.fulfilled
                .then(authorities => {
                    authorities.should.be.an('array').and.have.length(2)
                    authorities.forEach((authority, i) => {
                        authority.should.have.all.keys('id', 'name', 'createdAt', 'updatedAt')
                        authority.should.have.property('id').to.be.a.uuid('v4')
                        authority.should.have.property('name').to.be.a('string').and.equal(`USER2_AUTHORITY_${i + 1}`)
                        authority.should.have.property('createdAt').to.be.a.dateString()
                        authority.should.have.property('updatedAt').to.be.a.dateString()
                    })
                })
                .should.notify(done)
        })

        it('should not give two authorities to a user when user id is unknown', done => {
            const userId = uuidv4()
            addAuthoritiesToUserById(['AUTHORITY_1', 'AUTHORITY_2'], userId)
                .should.be.rejectedWith(NotFoundError, `User.id = ${userId} was not found.`)
                .should.notify(done)
        })

        it('should not give two authorities to a user when authority names are null', done => {
            addAuthoritiesToUserById(null, mockedUser.id)
                .should.be.rejectedWith(NotNullViolationError, 'names cannot be null.')
                .should.notify(done)
        })

        it('should not give two authorities to a user when user id is null', done => {
            addAuthoritiesToUserById(['AUTHORITY_1', 'AUTHORITY_2'], null)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .should.notify(done)
        })
    })

    describe('Find authorities', () => {
        it('should find two authorities belonging to a user', done => {
            findAllAuthoritiesByUserId(mockedUser.id)
                .should.be.fulfilled
                .then(authorities => {
                    authorities.should.be.an('array').and.have.length(2)
                    authorities.forEach((authority, i) => {
                        authority.should.have.all.keys('id', 'name', 'createdAt', 'updatedAt')
                        authority.should.have.property('id').to.be.a.uuid('v4')
                        authority.should.have.property('name').to.be.a('string').and.equal(`USER1_AUTHORITY_${i + 1}`)
                        authority.should.have.property('createdAt').to.be.a.dateString()
                        authority.should.have.property('updatedAt').to.be.a.dateString()
                    })
                })
                .should.notify(done)
        })

        it('should find two authorities belonging to another user', done => {
            findAllAuthoritiesByUserId(mockedSecondUser.id)
                .should.be.fulfilled
                .then(authorities => {
                    authorities.should.be.an('array').and.have.length(2)
                    authorities.forEach((authority, i) => {
                        authority.should.have.all.keys('id', 'name', 'createdAt', 'updatedAt')
                        authority.should.have.property('id').to.be.a.uuid('v4')
                        authority.should.have.property('name').to.be.a('string').and.equal(`USER2_AUTHORITY_${i + 1}`)
                        authority.should.have.property('createdAt').to.be.a.dateString()
                        authority.should.have.property('updatedAt').to.be.a.dateString()
                    })
                })
                .should.notify(done)
        })

        it('should not find two authorities belonging to a use when user id is unknown', done => {
            const userId = uuidv4()
            findAllAuthoritiesByUserId(userId)
                .should.be.rejectedWith(NotFoundError, `User.id = ${userId} was not found.`)
                .should.notify(done)
        })

        it('should not find two authorities belonging to a use when user id is null', done => {
            findAllAuthoritiesByUserId(null)
                .should.be.rejectedWith(NotNullViolationError, 'userId cannot be null.')
                .should.notify(done)
        })
    })
})
