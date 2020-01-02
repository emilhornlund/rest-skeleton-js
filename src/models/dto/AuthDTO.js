/**
 * AuthDTO class
 */
class AuthDTO {
    /**
     * AuthDTO constructor
     * @param {JwtDTO} authToken JWT DTO instance
     * @param {JwtDTO} refreshToken JWT DTO instance
     */
    constructor (authToken, refreshToken) {
        this.authToken = authToken
        this.refreshToken = refreshToken
    }
}

module.exports = AuthDTO
