import { Migration } from '@mikro-orm/migrations';

export class Migration20251203140153 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "banner" drop column if exists "media_id";`);

    this.addSql(`alter table if exists "banner" add column if not exists "image_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "banner" drop column if exists "image_url";`);

    this.addSql(`alter table if exists "banner" add column if not exists "media_id" text not null;`);
  }

}
