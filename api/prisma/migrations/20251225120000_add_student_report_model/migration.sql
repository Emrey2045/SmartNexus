-- CreateTable
CREATE TABLE "StudentReport" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_StudentReport_studentId" ON "StudentReport"("studentId");

-- CreateIndex
CREATE INDEX "IX_StudentReport_schoolId" ON "StudentReport"("schoolId");

-- CreateIndex
CREATE INDEX "IX_StudentReport_createdByUserId" ON "StudentReport"("createdByUserId");

-- CreateIndex
CREATE INDEX "IX_StudentReport_createdAt" ON "StudentReport"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "FK_StudentReport_Student" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "FK_StudentReport_School" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentReport" ADD CONSTRAINT "FK_StudentReport_User" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
