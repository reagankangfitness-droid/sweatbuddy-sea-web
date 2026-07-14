CREATE INDEX IF NOT EXISTS "activities_activityMode_status_moderationStatus_startTime_idx"
  ON "activities" ("activityMode", "status", "moderationStatus", "startTime");

CREATE INDEX IF NOT EXISTS "activities_activityMode_status_moderationStatus_lat_lng_start_idx"
  ON "activities" ("activityMode", "status", "moderationStatus", "latitude", "longitude", "startTime");
