const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'user'
    })

    User.associate = models => {
        User.belongsToMany(models.Authority, { as: 'Authorities', through: 'UserAuthorities' })
    }

    return User
}
