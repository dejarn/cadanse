-- D8: Partial unique index: at most one active season
CREATE UNIQUE INDEX "seasons_one_active" ON "seasons" ("isActive") WHERE "isActive" = true;

-- D9: Unique constraint: show name must be unique within a season
ALTER TABLE "shows" ADD CONSTRAINT "shows_name_seasonId_key" UNIQUE ("name", "seasonId");

-- WR-04: Missing indexes on FK columns

-- Class
CREATE INDEX "classes_seasonId_idx" ON "classes" ("seasonId");
CREATE INDEX "classes_teacherId_idx" ON "classes" ("teacherId");

-- StudentClass
CREATE INDEX "student_classes_classId_idx" ON "student_classes" ("classId");
CREATE INDEX "student_classes_studentId_idx" ON "student_classes" ("studentId");

-- Show
CREATE INDEX "shows_seasonId_idx" ON "shows" ("seasonId");

-- Act
CREATE INDEX "acts_showId_idx" ON "acts" ("showId");
CREATE INDEX "acts_classId_idx" ON "acts" ("classId");

-- ShowParticipation
CREATE INDEX "show_participations_showId_idx" ON "show_participations" ("showId");
CREATE INDEX "show_participations_studentId_idx" ON "show_participations" ("studentId");

-- ActParticipation
CREATE INDEX "act_participations_studentId_idx" ON "act_participations" ("studentId");

-- Scene
CREATE INDEX "scenes_actId_idx" ON "scenes" ("actId");

-- Placement
CREATE INDEX "placements_sceneId_idx" ON "placements" ("sceneId");
CREATE INDEX "placements_studentId_idx" ON "placements" ("studentId");
