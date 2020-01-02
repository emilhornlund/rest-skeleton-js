'use strict'

const UserId = 'b683d40d-97ef-48c3-bd52-a0f396b73cee'

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Users', [{
            id: UserId,
            username: 'demo',
            password: 'ecdfcae75d151e425c7f1b5a08875c72$474f44ff09560f65390bd8fe7d8a6018d79683dc34c4c5f6af1443854766f0cd',
            createdAt: new Date(),
            updatedAt: new Date()
        }], {})
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('Users', { id: UserId }, {})
    }
}
