import { Migration } from '@mikro-orm/migrations';

export class Migration20260223063932 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" drop constraint if exists "blog_post_slug_unique";`);
    this.addSql(`create table if not exists "blog_post" ("id" text not null, "title" text not null, "slug" text not null, "content" text null, "excerpt" text null, "author" text null, "image_url" text null, "is_published" boolean not null default false, "published_at" timestamptz null, "category" text null, "reading_time" text null, "likes_count" integer not null default 0, "is_featured" boolean not null default false, "meta_title" text null, "meta_description" text null, "keywords" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_post_slug_unique" ON "blog_post" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blog_post" cascade;`);
  }

}
