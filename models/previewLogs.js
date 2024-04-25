
const { DataTypes } = require('sequelize');
const sequelize = require("../lib/config/database");
const LmsGame = require('./game');

const PreviewLogs = sequelize.define('PreviewLogs', {
  previewLogId: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER
        },
        playerId: {
          allowNull: false,
          type: DataTypes.INTEGER,
        },
        playerType: {
          allowNull: false,
          type: DataTypes.ENUM('creator', 'reviewer')
        },
        previewGameId: {
          allowNull: false,
          type: DataTypes.INTEGER
        },
        nevigatedSeq: {
          type: DataTypes.JSON
        },
        screenIdSeq: {
           type: DataTypes.JSON,
           allowNull: true
         },
        lastActiveBlockSeq: {
           type: DataTypes.STRING(10),
           allowNull: true
         },
         selectedOptions: {
           type: DataTypes.JSON,
           allowNull: true
         },
         previewScore: {
           type: DataTypes.JSON,
           allowNull: true
         },
         previewProfile: {
           type: DataTypes.JSON,
           allowNull: true
         },
         audioVolumeValue: {
           type: DataTypes.DECIMAL(2, 1),
           defaultValue: 0.5
         },
         lastModifiedBlockSeq: {
           type: DataTypes.INTEGER
         },
         lastBlockModifiedDate: {
           type: DataTypes.DATE,
           allowNull: true
         },
         createdAt: {
           allowNull: false,
           type: DataTypes.DATE
         },
        updatedAt: {
          allowNull: true,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),// Use Sequelize function to get current timestamp
        },
}, {
  tableName: 'previews_logs',
  timestamps: true
});

  PreviewLogs.associate = (models) => {
    PreviewLogs.belongsTo(LmsGame, { foreignKey: 'previewGameId', as: 'game' });
  };
module.exports = PreviewLogs;
