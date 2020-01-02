/**
 * AppDTO class
 */
class AppDTO {
    /**
     * AppDTO constructor
     * @param {string} id Unique authority id
     * @param {string} name App name
     * @param {string} key API-key
     * @param {string} createdAt Date when created
     * @param {string} updatedAt Date when updated
     */
    constructor (id, name, key, createdAt, updatedAt) {
        this.id = id
        this.name = name
        this.key = key
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    /**
     * Converts a App DAO model instance into an App DTO model instance
     * @param dao App DAO model instance
     * @returns {AppDTO} App DTO model instance
     */
    static fromDAO (dao) {
        const obj = dao.get({ plain: true })
        return new AppDTO(obj.id, obj.name, obj.key, obj.createdAt, obj.updatedAt)
    }
}

module.exports = AppDTO
