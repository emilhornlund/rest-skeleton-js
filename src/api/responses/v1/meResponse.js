/**
 * MeResponse class
 */
module.exports = class MeResponse {
    /**
     * MeResponse constructor
     * @param {string} id
     * @param {string} username
     * @param {string[]} authorities
     * @param {string} createdAt
     * @param {string} updatedAt
     */
    constructor (id, username, authorities, createdAt, updatedAt) {
        this.id = id
        this.username = username
        this.authorities = authorities
        this.created_at = createdAt
        this.updated_at = updatedAt
    }

    /**
     * Converts a UserDTO model and AuthorityDTO model instances into an MeResponse model instance
     * @param {UserDTO} userDTO
     * @param {AuthorityDTO[]} authorityDTOs
     * @returns {MeResponse}
     */
    static fromDTO (userDTO, authorityDTOs) {
        const authorityNames = authorityDTOs.map(authority => authority.name)
        return new MeResponse(userDTO.id, userDTO.username, authorityNames, userDTO.createdAt, userDTO.updatedAt)
    }
}
