import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class AddStationIdToRewardClaims1732720000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add stationId column if it doesn't exist
    const table = await queryRunner.getTable('reward_claims');
    
    if (table && !table.findColumnByName('stationId')) {
      await queryRunner.addColumn(
        'reward_claims',
        new TableColumn({
          name: 'stationId',
          type: 'uuid',
          isNullable: true,
        })
      );

      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'reward_claims',
        new TableForeignKey({
          columnNames: ['stationId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'stations',
          onDelete: 'CASCADE',
        })
      );

      // Add index for better query performance
      await queryRunner.createIndex(
        'reward_claims',
        new TableIndex({
          columnNames: ['stationId', 'isClaimed'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('reward_claims');
    
    if (table && table.findColumnByName('stationId')) {
      // Drop foreign key first
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.includes('stationId'));
      if (foreignKey) {
        await queryRunner.dropForeignKey('reward_claims', foreignKey);
      }

      // Drop index
      const index = table.indices.find(idx => idx.columnNames.includes('stationId'));
      if (index) {
        await queryRunner.dropIndex('reward_claims', index);
      }

      // Drop column
      await queryRunner.dropColumn('reward_claims', 'stationId');
    }
  }
}
