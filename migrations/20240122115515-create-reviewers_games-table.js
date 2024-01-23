'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('lmsreviewersGames', { 
      gameUuid: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'lmsreviewersgames',
      freezeTableName: true,
      timestamps: false,
      underscored: true,
      primaryKey: false,
    });

    // Add foreign key constraint
    
    await queryInterface.addConstraint('lmsreviewersGames', { 
      fields: ['gameId'],
      type: 'foreign key',
      name: 'fk_gameId',
      references: {
        table: 'lmsgame', // Assuming the related table is named lmsgame
        field: 'gameId',
      },
      onDelete: 'CASCADE', // Adjust as needed
      onUpdate: 'CASCADE', // Adjust as needed
    });

    await queryInterface.addConstraint('lmsreviewersGames', { 
      fields: ['reviewerId'],
      type: 'foreign key',
      name: 'fk_reviewerId',
      references: {
        table: 'lmsgamereviewers', // Assuming the related table is named lmsgame
        field: 'gameReviewerId',
      },
      onDelete: 'CASCADE', // Adjust as needed
      onUpdate: 'CASCADE', // Adjust as needed
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('lmsreviewersGames');
  }
};
