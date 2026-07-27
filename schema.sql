-- ============================================================
-- STEG Cut Tracker Tunisia — Supabase/PostGIS Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- 1. OUTAGE REPORTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outage_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location    GEOMETRY(Point, 4326) NOT NULL,
  governorate TEXT NOT NULL,
  delegation  TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'OFF' CHECK (status IN ('OFF', 'RESTORED')),
  source      TEXT NOT NULL DEFAULT 'USER' CHECK (source IN ('USER', 'BOT', 'SCRAPER', 'SIGNAL')),
  confirmations INTEGER DEFAULT 0,
  disputes      INTEGER DEFAULT 0,
  device_id     TEXT,
  signal_type   TEXT,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at    TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 2. SPATIAL & PERFORMANCE INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_outage_reports_location
  ON outage_reports USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_outage_reports_created_at
  ON outage_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outage_reports_status
  ON outage_reports (status);

-- ------------------------------------------------------------
-- 3. INSERT HELPER (avoids raw WKT in client code)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_outage_report(
  p_latitude   DOUBLE PRECISION,
  p_longitude  DOUBLE PRECISION,
  p_governorate TEXT,
  p_delegation  TEXT DEFAULT '',
  p_source      TEXT DEFAULT 'USER',
  p_device_id   TEXT DEFAULT NULL,
  p_signal_type TEXT DEFAULT NULL,
  p_ip_address  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_id     UUID;
  v_result JSONB;
BEGIN
  INSERT INTO outage_reports (
    location, governorate, delegation, status, source, device_id, signal_type, ip_address
  )
  VALUES (
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
    p_governorate,
    p_delegation,
    'OFF',
    p_source,
    p_device_id,
    p_signal_type,
    p_ip_address
  )
  RETURNING id INTO v_id;

  v_result := jsonb_build_object('id', v_id);
  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- 4. CONFIRM REPORT FUNCTION (increment confirmation count)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_report(p_report_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE outage_reports
  SET confirmations = confirmations + 1
  WHERE id = p_report_id
  RETURNING jsonb_build_object('id', id, 'confirmations', confirmations) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('error', 'Report not found');
  END IF;

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- 5. DISPUTE REPORT FUNCTION (community moderation)
-- ------------------------------------------------------------
-- Increments the dispute counter; if it reaches the threshold (3),
-- the report is automatically marked RESTORED (removed from map).
CREATE OR REPLACE FUNCTION dispute_report(p_report_id UUID, p_threshold INT DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_disputes INTEGER;
  v_status   TEXT;
  v_result   JSONB;
BEGIN
  UPDATE outage_reports
  SET disputes = COALESCE(disputes, 0) + 1
  WHERE id = p_report_id AND status = 'OFF'
  RETURNING disputes, status INTO v_disputes, v_status;

  IF v_disputes IS NULL THEN
    RETURN jsonb_build_object('error', 'Report not found or already resolved');
  END IF;

  IF v_disputes >= p_threshold THEN
    UPDATE outage_reports
    SET status = 'RESTORED', expired_at = NOW()
    WHERE id = p_report_id;
    v_status := 'RESTORED';
  END IF;

  v_result := jsonb_build_object(
    'id', p_report_id,
    'disputes', v_disputes,
    'removed', v_disputes >= p_threshold,
    'status', v_status
  );
  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- 6. ACTIVE CLUSTERS FUNCTION (ST_ClusterDBSCAN)
-- ------------------------------------------------------------
-- Returns a GeoJSON FeatureCollection of:
--   - Clusters (circles) for groups of reports within radius_meters
--   - Individual points for unclustered reports
-- Only reports with status='OFF' within the last time_window_minutes
-- and not expired are included.
CREATE OR REPLACE FUNCTION get_active_clusters(
  radius_meters       INT DEFAULT 1500,
  time_window_minutes INT DEFAULT 120
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH
  active_reports AS (
    SELECT id, location, governorate, delegation, status, source, confirmations, created_at
    FROM outage_reports
    WHERE status = 'OFF'
      AND created_at >= NOW() - (time_window_minutes || ' minutes')::INTERVAL
      AND (expired_at IS NULL OR expired_at > NOW())
  ),
  clustered AS (
    SELECT
      ST_ClusterDBSCAN(location, radius_meters / 111320.0, 2) OVER () AS cluster_id,
      id,
      location,
      governorate,
      delegation,
      status,
      source,
      confirmations,
      created_at
    FROM active_reports
  ),
  cluster_centroids AS (
    SELECT
      cluster_id,
      COUNT(*)                                               AS report_count,
      SUM(confirmations)                                     AS total_confirmations,
      ST_AsGeoJSON(ST_Centroid(ST_Collect(location)))::JSONB AS centroid,
      array_agg(DISTINCT governorate)                        AS governorates,
      MIN(created_at)                                        AS first_report,
      MAX(created_at)                                        AS last_report
    FROM clustered
    WHERE cluster_id IS NOT NULL
    GROUP BY cluster_id
    HAVING COUNT(*) >= 2
  ),
  cluster_features AS (
    SELECT
      jsonb_build_object(
        'type',       'Feature',
        'geometry',   centroid,
        'properties',         jsonb_build_object(
          'cluster_id',          cluster_id,
          'report_count',        report_count,
          'total_confirmations', COALESCE(total_confirmations, 0),
          'governorates',        governorates,
          'first_report',        first_report,
          'last_report',         last_report,
          'severity',      CASE
                             WHEN report_count >= 10 THEN 'high'
                             WHEN report_count >= 5  THEN 'medium'
                             ELSE 'low'
                           END
        )
      ) AS feature
    FROM cluster_centroids
  ),
  singles AS (
    SELECT
      ST_AsGeoJSON(location)::JSONB AS geometry,
      jsonb_build_object(
        'id',            id,
        'governorate',   governorate,
        'delegation',    delegation,
        'status',        status,
        'source',        source,
        'confirmations', confirmations,
        'created_at',    created_at
      ) AS properties
    FROM clustered
    WHERE cluster_id IS NULL
      AND (
        source IN ('SCRAPER', 'BOT')
        OR created_at >= NOW() - INTERVAL '30 minutes'
      )
  ),
  single_features AS (
    SELECT
      jsonb_build_object(
        'type',       'Feature',
        'geometry',   geometry,
        'properties', properties
      ) AS feature
    FROM singles
  ),
  all_features AS (
    SELECT feature FROM cluster_features
    UNION ALL
    SELECT feature FROM single_features
  )
  SELECT
    jsonb_build_object(
      'type',     'FeatureCollection',
      'features', COALESCE(jsonb_agg(feature), '[]'::JSONB),
      'metadata', jsonb_build_object(
        'total_clusters',       (SELECT COUNT(*) FROM cluster_centroids),
        'total_reports',        (SELECT COUNT(*) FROM active_reports),
        'radius_meters',        radius_meters,
        'time_window_minutes',  time_window_minutes
      )
    ) INTO result
  FROM all_features;

  RETURN result;
END;
$$;

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE outage_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON outage_reports;
DROP POLICY IF EXISTS "Allow public insert" ON outage_reports;
DROP POLICY IF EXISTS "Allow public update" ON outage_reports;

CREATE POLICY "Allow public read" ON outage_reports
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON outage_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON outage_reports
  FOR UPDATE USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. DEVICE HEARTBEATS (passive monitoring)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_heartbeats (
  device_id       TEXT PRIMARY KEY,
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  governorate     TEXT,
  online          BOOLEAN NOT NULL DEFAULT true,
  last_offline_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_heartbeats_last_seen
  ON device_heartbeats (last_seen DESC);

ALTER TABLE device_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read heartbeats" ON device_heartbeats
  FOR SELECT USING (true);

CREATE POLICY "Allow public upsert heartbeats" ON device_heartbeats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update heartbeats" ON device_heartbeats
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION restore_device_outages(p_device_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE outage_reports
  SET status = 'RESTORED'
  WHERE device_id = p_device_id
    AND status = 'OFF'
    AND source IN ('SIGNAL', 'USER')
    AND created_at >= NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION expire_stale_outages()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE outage_reports
  SET status = 'RESTORED'
  WHERE status = 'OFF'
    AND source IN ('USER', 'SIGNAL')
    AND confirmations = 0
    AND created_at < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
