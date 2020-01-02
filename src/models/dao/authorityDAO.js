const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    const Authority = sequelize.define('Authority', {
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
            unique: true
        }
    }, {
        sequelize,
        modelName: 'authority'
    })

    Authority.associate = models => {
        Authority.belongsToMany(models.User, { as: 'Users', through: 'UserAuthorities' })
    }

    return Authority
}
