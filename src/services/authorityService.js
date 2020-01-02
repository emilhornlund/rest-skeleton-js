const logger = require('../logger')
const { unwrapValue } = require('../helpers/unwrap')
const { sequelize, Authority, User } = require('../models/dao')
const { AuthorityDTO } = require('../models/dto')
const {
    DomainError,
    NotFoundError,
    InternalError
} = require('../errors')

/**
 * Assign a user authorities
 * @param {string[]} names
 * @param {string} userId
 * @returns {Promise<DomainError | AuthorityDTO[]>}
 */
exports.addAuthoritiesToUserById = (names, userId) => {
    return unwrapValue(names, 'names')
        .then(() => unwrapValue(userId, 'userId'))
        .then(() => {
            logger.silly(`Will begin adding authorities ${names.join(',')} to user ${userId}.`)
            return sequelize.transaction(transaction => {
                return User.findOne({ where: { id: userId }, transaction })
                    .then(user => {
                        if (!user) return Promise.reject(new NotFoundError(`User.id = ${userId}`))
                        return Promise.all(names.map(name => {
                            return Authority.findOrCreate({ where: { name }, transaction })
                                .then(([authority]) => {
                                    return user.addAuthority(authority, { transaction })
                                        .then(() => Promise.resolve(authority))
                                })
                        }))
                    })
            })
        })
        .then(results => {
            logger.silly(`Successfully added authorities ${names.join(',')} to user ${userId}.`)
            return Promise.resolve(results.map(AuthorityDTO.fromDAO))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}

/**
 * Finds all authorities belonging to a user
 * @param {string} userId
 * @returns {Promise<DomainError | AuthorityDTO[]>}
 */
exports.findAllAuthoritiesByUserId = userId => {
    return unwrapValue(userId, 'userId')
        .then(() => {
            logger.silly(`Will begin finding authorities belonging to user ${userId}.`)
            return User.findOne({ where: { id: userId } })
        })
        .then(user => {
            if (!user) return Promise.reject(new NotFoundError(`User.id = ${userId}`))
            return user.getAuthorities({ order: [['name', 'ASC']], joinTableAttributes: [] })
        })
        .then(authorities => {
            const names = authorities.map(authority => authority.name).join(',')
            logger.silly(`Successfully found authorities [${names}] belonging to user ${userId}.`)
            return Promise.resolve(authorities.map(AuthorityDTO.fromDAO))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            return Promise.reject(new InternalError(err))
        })
}
