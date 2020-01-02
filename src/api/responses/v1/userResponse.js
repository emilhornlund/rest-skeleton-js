/**
 * UserResponse class
 */
module.exports = class UserResponse {
    /**
     * UserResponse constructor
     * @param {string} id
     * @param {string} username
     * @param {string} createdAt
     * @param {string} updatedAt
     */
    constructor (id, username, createdAt, updatedAt) {
        this.id = id
        this.username = username
        this.created_at = createdAt
        this.updated_at = updatedAt
    }

    /**
     * Converts a UserDTO model instance into an UserResponse model instance
     * @param {UserDTO} dto
     * @returns {UserResponse}
     */
    static fromDTO (dto) {
        return new UserResponse(dto.id, dto.username, dto.createdAt, dto.updatedAt)
    }
}
