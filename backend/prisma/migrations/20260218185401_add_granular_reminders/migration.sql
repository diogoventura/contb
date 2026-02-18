/*
  Warnings:

  - You are about to drop the column `status` on the `consortiums` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_consortiums" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_value" DECIMAL NOT NULL,
    "monthly_value" DECIMAL NOT NULL,
    "total_slots" INTEGER NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "reminder_days_before" INTEGER,
    "reminder_interval_after" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "consortiums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_consortiums" ("created_at", "description", "end_date", "id", "monthly_value", "name", "start_date", "total_slots", "total_value", "updated_at", "user_id") SELECT "created_at", "description", "end_date", "id", "monthly_value", "name", "start_date", "total_slots", "total_value", "updated_at", "user_id" FROM "consortiums";
DROP TABLE "consortiums";
ALTER TABLE "new_consortiums" RENAME TO "consortiums";
CREATE INDEX "consortiums_user_id_idx" ON "consortiums"("user_id");
CREATE TABLE "new_sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "person_name" TEXT NOT NULL,
    "person_phone" TEXT,
    "person_email" TEXT,
    "person_document" TEXT,
    "total_amount" DECIMAL NOT NULL,
    "installment_count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sold_at" DATETIME NOT NULL,
    "consortium_id" INTEGER,
    "reminder_days_before" INTEGER,
    "reminder_interval_after" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_consortium_id_fkey" FOREIGN KEY ("consortium_id") REFERENCES "consortiums" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sales" ("created_at", "id", "installment_count", "notes", "person_document", "person_email", "person_name", "person_phone", "sold_at", "status", "total_amount", "updated_at", "user_id") SELECT "created_at", "id", "installment_count", "notes", "person_document", "person_email", "person_name", "person_phone", "sold_at", "status", "total_amount", "updated_at", "user_id" FROM "sales";
DROP TABLE "sales";
ALTER TABLE "new_sales" RENAME TO "sales";
CREATE INDEX "sales_user_id_idx" ON "sales"("user_id");
CREATE INDEX "sales_sold_at_idx" ON "sales"("sold_at");
CREATE INDEX "sales_status_idx" ON "sales"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
