/**
 * AuthorityDTO class
 */
class AuthorityDTO {
    /**
     * AuthorityDTO constructor
     * @param {string} id Unique authority id
     * @param {string} name Authority name
     * @param {string} createdAt Date when created
     * @param {string} updatedAt Date when updated
     */
    constructor (id, name, createdAt, updatedAt) {
        this.id = id
        this.name = name
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    /**
     * Converts a Authority DAO model instance into an Authority DTO model instance
     * @param dao Authority DAO model instance
     * @returns {AuthorityDTO} Authority DTO model instance
     */
    static fromDAO (dao) {
        const obj = dao.get({ plain: true })
        return new AuthorityDTO(obj.id, obj.name, obj.createdAt, obj.updatedAt)
    }
}

module.exports = AuthorityDTO
