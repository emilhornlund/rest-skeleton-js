/**
 * AppResponse class
 */
module.exports = class AppResponse {
    /**
     * AppResponse constructor
     * @param {string} id
     * @param {string} name
     * @param {string} createdAt
     * @param {string} updatedAt
     */
    constructor (id, name, createdAt, updatedAt) {
        this.id = id
        this.name = name
        this.created_at = createdAt
        this.updated_at = updatedAt
    }

    /**
     * Converts a AppDTO model instance into an AppResponse model instance
     * @param {AppDTO} dto
     * @returns {AppResponse}
     */
    static fromDTO (dto) {
        return new AppResponse(dto.id, dto.name, dto.createdAt, dto.updatedAt)
    }
}
