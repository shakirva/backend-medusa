import { Migration } from '@mikro-orm/migrations';

export class Migration20251119043200 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_brand" ("id" text not null, "product_id" text not null, "brand_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_deleted_at" ON "product_brand" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_brand" cascade;`);
  }

}
