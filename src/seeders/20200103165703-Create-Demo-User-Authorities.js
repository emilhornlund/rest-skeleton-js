'use strict'

const UserId = 'b683d40d-97ef-48c3-bd52-a0f396b73cee'
const AuthorityId1 = '49594889-d80c-4a16-ac31-1bc50aae0145'
const AuthorityId2 = '64d5ab35-cb0f-4896-ac97-c33a0e9fc356'

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('UserAuthorities', [
            {
                createdAt: new Date(),
                updatedAt: new Date(),
                AuthorityId: AuthorityId1,
                UserId
            },
            {
                createdAt: new Date(),
                updatedAt: new Date(),
                AuthorityId: AuthorityId2,
                UserId
            }
        ], {})
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('UserAuthorities', {
            [Sequelize.Op.or]: [
                { AuthorityId: AuthorityId1, UserId },
                { AuthorityId: AuthorityId2, UserId }
            ]
        }, {})
    }
}
