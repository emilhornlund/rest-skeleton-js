'use strict'

const ApiKey = 'b266502cf5da492d0c36412488436b45d2572c9b54e9144d7b384922537bb0a3'

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Apps', [{
            id: 'aa6720b4-552d-4bbc-9e6f-d14be611196c',
            name: 'rest-skeleton-js',
            key: ApiKey,
            createdAt: new Date(),
            updatedAt: new Date()
        }], {})
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('Apps', { key: ApiKey }, {})
    }
}
