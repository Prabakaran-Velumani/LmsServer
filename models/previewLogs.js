// previewLog.js
const { DataTypes } = require('sequelize');
const LmsGame = require('./game');

module.exports = (sequelize) => {
  const PreviewLogs = sequelize.define('PreviewLogs', {
    previewLogId: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    userType: {
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
    lastActiveBlockSeq: {
      type: DataTypes.STRING(10)
    },
    selectedOptions: {
      type: DataTypes.JSON
    },
    previewScore: {
      type: DataTypes.JSON
    },
    previewProfile: {
      type: DataTypes.JSON
    },
    audioVolumeValue: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0.5
    },
    lastModifiedBlockSeq: {
      type: DataTypes.INTEGER
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: true,
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'previews_logs',
    timestamps: true
  });

  PreviewLogs.associate = (models) => {
    PreviewLogs.belongsTo(LmsGame, { foreignKey: 'previewGameId', as: 'game' });
  };

  return PreviewLogs;
};
