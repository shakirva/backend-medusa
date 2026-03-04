import { Migration } from '@mikro-orm/migrations';

export class Migration20260228000000 extends Migration {

    override async up(): Promise<void> {
        this.addSql(`alter table if exists "brand" add column if not exists "is_special" boolean not null default false;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table if exists "brand" drop column if exists "is_special";`);
    }

}
