-- AlterTable
ALTER TABLE "movements" ADD COLUMN     "closing_id" TEXT;

-- CreateTable
CREATE TABLE "closings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "closings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closings" ADD CONSTRAINT "closings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
