import { Migration } from '@mikro-orm/migrations';

export class Migration20251124070543 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gallery" drop constraint if exists "gallery_slug_unique";`);
    this.addSql(`create table if not exists "banner" ("id" text not null, "title" text null, "media_id" text not null, "link" text null, "position" text null, "is_active" boolean not null default true, "start_at" text null, "end_at" text null, "display_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_deleted_at" ON "banner" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gallery" ("id" text not null, "name" text not null, "slug" text not null, "description" text null, "is_active" boolean not null default true, "display_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gallery_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gallery_slug_unique" ON "gallery" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gallery_deleted_at" ON "gallery" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gallery_media" ("id" text not null, "gallery_id" text not null, "media_id" text not null, "display_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gallery_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gallery_media_deleted_at" ON "gallery_media" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "media" ("id" text not null, "url" text not null, "mime_type" text null, "title" text null, "alt_text" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_media_deleted_at" ON "media" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "banner" cascade;`);

    this.addSql(`drop table if exists "gallery" cascade;`);

    this.addSql(`drop table if exists "gallery_media" cascade;`);

    this.addSql(`drop table if exists "media" cascade;`);
  }

}
