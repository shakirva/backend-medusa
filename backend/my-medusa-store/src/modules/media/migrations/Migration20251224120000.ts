import { Migration } from '@mikro-orm/migrations';

export class Migration20251224120000 extends Migration {

  override async up(): Promise<void> {
    // Add nullable thumbnail_url column to media table
    this.addSql(`alter table if exists "media" add column if not exists "thumbnail_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "media" drop column if exists "thumbnail_url";`);
  }

}
