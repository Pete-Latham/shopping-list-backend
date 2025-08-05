import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1754307151653 implements MigrationInterface {
    name = 'InitialSchema1754307151653'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shopping_list_items" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit" character varying, "completed" boolean NOT NULL DEFAULT false, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "shoppingListId" integer, CONSTRAINT "PK_043c112c02fdc1c39fbd619fadb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_lists" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9289ace7dd5e768d65290f3f9de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shopping_list_items" ADD CONSTRAINT "FK_268e82a2d60e718cbaf8354a0f8" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shopping_list_items" DROP CONSTRAINT "FK_268e82a2d60e718cbaf8354a0f8"`);
        await queryRunner.query(`DROP TABLE "shopping_lists"`);
        await queryRunner.query(`DROP TABLE "shopping_list_items"`);
    }

}
