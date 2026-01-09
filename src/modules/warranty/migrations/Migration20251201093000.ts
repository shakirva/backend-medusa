import { Migration } from '@mikro-orm/migrations';

export class Migration20251201093000 extends Migration {
  override async up(): Promise<void> {
    // warranties
    this.addSql(`create table if not exists "warranty" (
      "id" text not null,
      "product_id" text not null,
      "order_id" text null,
      "order_item_id" text null,
      "customer_email" text not null,
      "type" text not null default 'manufacturer',
      "duration_months" integer not null default 12,
      "start_date" timestamptz not null,
      "end_date" timestamptz null,
      "status" text not null default 'active',
      "terms" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "warranty_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_deleted_at" ON "warranty" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_customer_email" ON "warranty" (customer_email);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_product_id" ON "warranty" (product_id);`);

    // warranty_claims
    this.addSql(`create table if not exists "warranty_claim" (
      "id" text not null,
      "warranty_id" text not null,
      "customer_email" text not null,
      "issue_description" text not null,
      "status" text not null default 'submitted',
      "admin_notes" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "warranty_claim_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_claim_deleted_at" ON "warranty_claim" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_claim_warranty_id" ON "warranty_claim" (warranty_id);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warranty_claim_status" ON "warranty_claim" (status);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "warranty_claim" cascade;`);
    this.addSql(`drop table if exists "warranty" cascade;`);
  }
}
