import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenFields1754849235208 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "refreshToken" character varying,
            ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "refreshToken",
            DROP COLUMN "refreshTokenExpiresAt"
        `);
    }

}
