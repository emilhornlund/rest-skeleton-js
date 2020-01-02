'use strict'

const AuthorityId1 = '49594889-d80c-4a16-ac31-1bc50aae0145'
const AuthorityId2 = '64d5ab35-cb0f-4896-ac97-c33a0e9fc356'

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Authorities', [
            {
                id: AuthorityId1,
                name: 'APP_MANAGEMENT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: AuthorityId2,
                name: 'USER_MANAGEMENT',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {})
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('Authorities', {
            [Sequelize.Op.or]: [
                { id: AuthorityId1 },
                { id: AuthorityId2 }
            ]
        }, {})
    }
}
