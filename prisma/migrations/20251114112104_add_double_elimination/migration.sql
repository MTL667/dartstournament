/*
  Warnings:

  - Added the required column `bracket` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `round` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN "seed" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "bracket" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "player1Sets" INTEGER NOT NULL DEFAULT 0,
    "player2Sets" INTEGER NOT NULL DEFAULT 0,
    "currentSet" INTEGER NOT NULL DEFAULT 1,
    "currentLeg" INTEGER NOT NULL DEFAULT 1,
    "startingPlayer" TEXT,
    "currentPlayer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winnerId" TEXT,
    "loserId" TEXT,
    "winnerNextMatchId" TEXT,
    "loserNextMatchId" TEXT,
    "winnerSlot" TEXT,
    "loserSlot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "currentLeg", "currentPlayer", "currentSet", "id", "player1Id", "player1Sets", "player2Id", "player2Sets", "startingPlayer", "status", "tournamentId", "updatedAt", "winnerId") SELECT "createdAt", "currentLeg", "currentPlayer", "currentSet", "id", "player1Id", "player1Sets", "player2Id", "player2Sets", "startingPlayer", "status", "tournamentId", "updatedAt", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'double-elimination',
    "format" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "legs" INTEGER NOT NULL,
    "startScore" INTEGER NOT NULL DEFAULT 501,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "playersCount" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("createdAt", "format", "id", "legs", "name", "sets", "startScore", "status", "updatedAt") SELECT "createdAt", "format", "id", "legs", "name", "sets", "startScore", "status", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
