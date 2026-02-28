import { Migration } from '@mikro-orm/migrations';

export class Migration20251127090100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "seller" ("id" text not null, "name" text not null, "email" text null, "phone" text null, "legal_name" text null, "tax_id" text null, "address_json" jsonb null, "logo_url" text null, "status" text not null default 'pending', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller_request" ("id" text not null, "seller_name" text not null, "email" text null, "phone" text null, "documents_urls" jsonb null, "notes" text null, "status" text not null default 'pending', "decision_note" text null, "decided_at" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_request_deleted_at" ON "seller_request" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller_product_link" ("id" text not null, "seller_id" text not null, "product_id" text not null, "display_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_product_link_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_product_link_deleted_at" ON "seller_product_link" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "seller" cascade;`);
    this.addSql(`drop table if exists "seller_request" cascade;`);
    this.addSql(`drop table if exists "seller_product_link" cascade;`);
  }
}
