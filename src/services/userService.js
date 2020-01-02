const logger = require('../logger')
const { unwrapValue, unwrapObjectValue } = require('../helpers/unwrap')
const { User } = require('../models/dao')
const { UserDTO } = require('../models/dto')
const {
    DomainError,
    NotFoundError,
    NotUniqueError,
    InternalError
} = require('../errors')
const { hashPassword } = require('../helpers/security')

/**
 * Find all users
 * @returns {Promise<DomainError | UserDTO[]>}
 */
exports.findAllUsers = () => {
    logger.silly('Will begin finding all users')
    return User.findAll({ order: [['username', 'ASC']] })
        .then(users => {
            logger.silly(`Found ${users.length} user(s)`)
            return Promise.resolve(users.map(UserDTO.fromDAO))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}

/**
 * Creates a new user
 * @param {object} data
 * @returns {Promise<DomainError | UserDTO>}
 */
exports.createUser = data => {
    logger.silly('Will begin creating user')
    return unwrapValue(data, 'data')
        .then(() => unwrapObjectValue(data, 'username'))
        .then(() => unwrapObjectValue(data, 'password'))
        .then(() => {
            logger.silly(`Will find user by username ${data.username}`)
            return User.findOne({ where: { username: data.username } })
        })
        .then(user => {
            if (!user) {
                logger.silly(`Will create user ${data.username}`)
                return User.create({ username: data.username, password: hashPassword(data.password) })
            } else {
                logger.silly(`Could not create user with non unique username ${data.username}.`)
                return Promise.reject(new NotUniqueError(`User.username = ${data.username}`))
            }
        })
        .then(user => {
            logger.silly(`Created user ${user.username} with id ${user.id}`)
            return Promise.resolve(UserDTO.fromDAO(user))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}

/**
 * Finds a user by id
 * @param {string} userId
 * @returns {Promise<DomainError | UserDTO>}
 */
exports.findUserById = userId => {
    logger.silly(`Will begin finding user by id ${userId}`)
    return unwrapValue(userId, 'userId')
        .then(() => {
            logger.silly(`Will find user by id ${userId}`)
            return User.findOne({ where: { id: userId } })
        })
        .then(user => {
            if (user) {
                logger.silly(`Found user ${user.username} by id ${userId}`)
                return Promise.resolve(UserDTO.fromDAO(user))
            } else {
                logger.warn(`Could not find user by id ${userId}`)
                return Promise.reject(new NotFoundError(`User.id = ${userId}`))
            }
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}

/**
 * Finds a user by username
 * @param {string} username
 * @returns {Promise<DomainError | UserDTO>}
 */
exports.findUserByUsername = username => {
    logger.silly(`Will begin finding user by username ${username}`)
    return unwrapValue(username, 'username')
        .then(() => {
            logger.silly(`Will find user by name ${username}`)
            return User.findOne({ where: { username } })
        })
        .then(user => {
            if (user) {
                logger.silly(`Found user by username ${user.username}`)
                return Promise.resolve(UserDTO.fromDAO(user))
            } else {
                logger.warn(`Could not find user by name ${username}`)
                return Promise.reject(new NotFoundError(`User.username = ${username}`))
            }
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}

/**
 * Updates a user by id
 * @param {string} userId
 * @param {object} data
 * @returns {Promise<DomainError | UserDTO>}
 */
exports.updateUserById = (userId, data) => {
    logger.silly(`Will begin updating user by id ${userId}`)
    return unwrapValue(userId, 'userId')
        .then(() => unwrapValue(data, 'data'))
        .then(() => {
            logger.silly(`Will update user by id ${userId}`)
            return User.findOne({ where: { id: userId } })
        })
        .then(user => {
            if (user) {
                logger.silly(`Found user ${user.username} by id ${userId}`)
                const newData = {}
                if (data.username) newData.username = data.username
                if (data.password) newData.password = hashPassword(data.password)
                return user.update(newData)
            } else {
                logger.warn(`Could not find user by id ${userId}`)
                return Promise.reject(new NotFoundError(`User.id = ${userId}`))
            }
        })
        .then(user => {
            logger.silly(`Updated user ${user.username} by id ${user.id}`)
            return Promise.resolve(UserDTO.fromDAO(user))
        })
        .catch(err => {
            logger.error(err)
            if (err.name === 'SequelizeUniqueConstraintError' && err.fields.indexOf('username') !== -1) {
                logger.warn(`Could not update user with non unique username ${data.username}`)
                return Promise.reject(new NotUniqueError(`User.username = ${data.username}`))
            } else if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}

/**
 * Deletes a user by id
 * @param {string} userId Unique
 * @returns {Promise<DomainError | UserDTO>}
 */
exports.deleteUserById = userId => {
    logger.silly(`Will begin deleting user by id ${userId}`)
    return unwrapValue(userId, 'userId')
        .then(() => {
            logger.silly(`Will delete user by id ${userId}`)
            return User.findOne({ where: { id: userId } })
        })
        .then(user => {
            if (user) {
                logger.silly(`Found user ${user.username} by id ${userId}`)
                return user.destroy()
            } else {
                logger.warn(`Could not find user by id ${userId}`)
                return Promise.reject(new NotFoundError(`User.id = ${userId}`))
            }
        })
        .then(user => {
            logger.silly(`Deleted user ${user.username} by id ${user.id}`)
            return Promise.resolve(UserDTO.fromDAO(user))
        })
        .catch(err => {
            logger.error(err)
            if (err instanceof DomainError) return Promise.reject(err)
            else return Promise.reject(new InternalError(err))
        })
}
