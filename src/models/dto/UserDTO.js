/**
 * UserDTO class
 */
class UserDTO {
    /**
     * UserDTO constructor
     * @param {string} id Unique user id
     * @param {string} username Username
     * @param {string} password Password
     * @param {string} createdAt Date when created
     * @param {string} updatedAt Date when updated
     */
    constructor (id, username, password, createdAt, updatedAt) {
        this.id = id
        this.username = username
        this.password = password
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    /**
     * Converts a User DAO model instance into an User DTO model instance
     * @param dao User DAO model instance
     * @returns {UserDTO} User DTO model instance
     */
    static fromDAO (dao) {
        const obj = dao.get({ plain: true })
        return new UserDTO(obj.id, obj.username, obj.password, obj.createdAt, obj.updatedAt)
    }
}

module.exports = UserDTO
