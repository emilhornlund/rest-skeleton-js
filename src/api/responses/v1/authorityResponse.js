/**
 * AuthorityResponse class
 */
module.exports = class AuthorityResponse {
    /**
     * AuthorityResponse constructor
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
     * Converts a AuthorityDTO model instance into an AuthorityResponse model instance
     * @param {AuthorityDTO} dto
     * @returns {AuthorityResponse}
     */
    static fromDTO (dto) {
        return new AuthorityResponse(dto.id, dto.name, dto.createdAt, dto.updatedAt)
    }
}
