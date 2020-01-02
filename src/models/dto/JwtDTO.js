/**
 * JwtDTO class
 */
class JwtDTO {
    /**
     * JwtDTO constructor
     * @param {string} id Unique jwt id
     * @param {string} userId Unique user id
     * @param {string} token JsonWebToken
     * @param {string[]} authorities
     * @param {string} createdAt Date when created
     * @param {string} updatedAt Date when updated
     */
    constructor (id, userId, token, authorities, createdAt, updatedAt) {
        this.id = id
        this.userId = userId
        this.token = token
        this.authorities = authorities
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    /**
     * Converts a Jwt DAO model instance into an Jwt DTO model instance
     * @param dao Jwt DAO model instance
     * @returns {JwtDTO} Jwt DTO model instance
     */
    static fromDAO (dao) {
        const obj = dao.get({ plain: true })
        const authorities = obj.User ? obj.User.Authorities : []
        return new JwtDTO(obj.id, obj.UserId, obj.token, authorities, obj.createdAt, obj.updatedAt)
    }
}

module.exports = JwtDTO
