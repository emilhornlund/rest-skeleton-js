const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('App', {
        id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: false
        },
        key: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'app'
    })
}
