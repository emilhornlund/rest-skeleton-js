/**
 * AuthResponse class
 */
module.exports = class AuthResponse {
    /**
     * AuthResponse constructor
     * @param {string} authToken
     * @param {string} refreshToken
     */
    constructor (authToken, refreshToken) {
        this.auth_token = authToken
        this.refresh_token = refreshToken
    }

    /**
     * Converts a AuthDTO model instance into an AuthResponse model instance
     * @param {AuthDTO} dto
     * @returns {AuthResponse}
     */
    static fromDTO (dto) {
        return new AuthResponse(dto.authToken.token, dto.refreshToken.token)
    }
}
