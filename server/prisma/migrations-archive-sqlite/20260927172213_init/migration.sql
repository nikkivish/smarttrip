-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "coverImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "travellers" INTEGER NOT NULL DEFAULT 1,
    "budget" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "safetyScore" INTEGER,
    "safetyLevel" TEXT,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    CONSTRAINT "ItineraryDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItineraryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "cost" REAL,
    "safetyLevel" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "placeLabel" TEXT,
    "imageUrl" TEXT,
    CONSTRAINT "ItineraryItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ItineraryDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tripId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alert_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tripId" TEXT,
    "note" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_startDate_idx" ON "Trip"("userId", "startDate");

-- CreateIndex
CREATE INDEX "ItineraryDay_tripId_idx" ON "ItineraryDay"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_tripId_day_key" ON "ItineraryDay"("tripId", "day");

-- CreateIndex
CREATE INDEX "ItineraryItem_dayId_idx" ON "ItineraryItem"("dayId");

-- CreateIndex
CREATE INDEX "Alert_userId_createdAt_idx" ON "Alert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_userId_createdAt_idx" ON "CheckIn"("userId", "createdAt");
