const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    const Jwt = sequelize.define('Jwt', {
        id: {
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true
        },
        token: {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'jwt'
    })

    Jwt.associate = models => {
        Jwt.belongsTo(models.User)
    }

    return Jwt
}
