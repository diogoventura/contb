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
    "status" TEXT NOT NULL DEFAULT 'active',
    "reminder_days_before" INTEGER,
    "reminder_interval_after" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "consortiums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_consortiums" ("created_at", "description", "end_date", "id", "monthly_value", "name", "reminder_days_before", "reminder_interval_after", "start_date", "total_slots", "total_value", "updated_at", "user_id") SELECT "created_at", "description", "end_date", "id", "monthly_value", "name", "reminder_days_before", "reminder_interval_after", "start_date", "total_slots", "total_value", "updated_at", "user_id" FROM "consortiums";
DROP TABLE "consortiums";
ALTER TABLE "new_consortiums" RENAME TO "consortiums";
CREATE INDEX "consortiums_user_id_idx" ON "consortiums"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
