import { Migration } from '@mikro-orm/migrations';

export class Migration20260105065125 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "media" add column if not exists "title_ar" text null, add column if not exists "thumbnail_url" text null, add column if not exists "brand" text null, add column if not exists "views" integer not null default 0, add column if not exists "display_order" integer not null default 0, add column if not exists "is_featured" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "media" drop column if exists "title_ar", drop column if exists "thumbnail_url", drop column if exists "brand", drop column if exists "views", drop column if exists "display_order", drop column if exists "is_featured";`);
  }

}
