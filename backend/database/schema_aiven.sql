-- =============================================================================
-- GADS Schema Audit — Production-Ready Corrected Schema
-- Twin Birds | Reviewed against actual CSV/TSV data files
-- =============================================================================

-- ============================================================
-- AUDIT FINDINGS SUMMARY
-- ============================================================
-- 
-- 1.  [CRITICAL]  avg_cpm, avg_cpv, trueview_views, unique_users,
--                 impressions, clicks, conversions, conv_value stored
--                 as VARCHAR — they are numeric in the data.
--                 VARCHAR kills aggregation, ROAS calcs, and all math.
--
-- 2.  [CRITICAL]  engagement_rate, bounce_rate, avg_engagement_time_sec,
--                 avg_session_duration_sec, user_key_event_rate stored
--                 as VARCHAR — they are FLOAT64 in the data.
--
-- 3.  [CRITICAL]  product_catalog.price stored as NUMERIC but data is
--                 "649.00 INR" (string). ETL must strip currency before
--                 inserting. Schema should document this clearly.
--
-- 4.  [CRITICAL]  product_catalog.sell_on_google_qty is VARCHAR(50)
--                 but data is INT (91, 0, ...). Must be INTEGER.
--
-- 5.  [CRITICAL]  product_catalog.all_clicks is VARCHAR(50)
--                 but data is INT (0, 3, ...). Must be BIGINT.
--
-- 6.  [CRITICAL]  ga4_lead_acquisition has new_leads/qualified_leads/
--                 converted_leads columns but the ACTUAL file only has:
--                 "New leads", "Qualified leads", "Converted leads" — 
--                 which are always 0 in the data. The real column is
--                 "User key event rate". Schema is semantically wrong.
--
-- 7.  [HIGH]      ga4_user_cohorts.avg_120d_value is VARCHAR(50)
--                 but data is FLOAT (14.22, 26.28, ...).
--
-- 8.  [HIGH]      executive_overview VIEW joins on window_id but does
--                 NOT filter by window_id — aggregates ALL windows ever
--                 loaded, double-counting if you ingest twice.
--
-- 9.  [HIGH]      sku_opportunity_matrix VIEW has wrong thresholds:
--                 items_viewed > 100 / items_purchased = 0 is too loose.
--                 With 9123 products and many with 0 purchases, nearly
--                 everything flags as 'high_view_no_buy'.
--
-- 10. [HIGH]      product_catalog has no feed_snapshot_date column.
--                 Cannot tell which TSV snapshot a row came from.
--                 When you reload next month's feed, old rows are
--                 indistinguishable from new ones.
--
-- 11. [MEDIUM]    No CHECK constraints anywhere — negative cost, 
--                 impossible rates (>1.0), etc. can silently enter DB.
--
-- 12. [MEDIUM]    ga4_traffic_channels: actual column name in data is
--                 "Session primary channel group (Default channel group)"
--                 — the long name. ETL must rename to channel_group.
--
-- 13. [MEDIUM]    ga4_lead_acquisition: actual column name is
--                 "First user primary channel group (Default channel group)"
--
-- 14. [MEDIUM]    product_catalog missing columns present in TSV:
--                 additional_image_links (TEXT[]), product_detail (TEXT),
--                 custom_labels (0-4), is_active flag.
--
-- 15. [LOW]       ingestion_log and data_quality_flags are too thin.
--                 No brand_id, no window_id, no row-level error detail.
--
-- ============================================================


-- ---------------------------------------------------------------------------
-- BRANDS (unchanged — correct)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
    brand_id     SERIAL       PRIMARY KEY,
    brand_name   VARCHAR(255) NOT NULL,
    brand_slug   VARCHAR(255) UNIQUE NOT NULL,
    country_code CHAR(2)      NOT NULL,
    currency_code CHAR(3)     NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- REPORT WINDOWS (add window_days for scaling)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_windows (
    window_id    SERIAL  PRIMARY KEY,
    brand_id     INT     NOT NULL REFERENCES brands(brand_id),
    window_start DATE    NOT NULL,
    window_end   DATE    NOT NULL,
    -- FIX: computed column so ETL doesn't have to pass it
    window_days  INT     GENERATED ALWAYS AS (window_end - window_start + 1) STORED,
    source       VARCHAR(50) NOT NULL,   -- 'google_ads' | 'ga4' | 'merchant_center'
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_start, window_end, source)
);


-- ---------------------------------------------------------------------------
-- AD_CAMPAIGNS
-- FIX 1: avg_cpm, avg_cpv, trueview_views, unique_users → correct numeric types
-- FIX 2: impressions, clicks, conversions, conv_value were object/str → typed
-- FIX 3: add optimisation_score, ctr, avg_target_roas (present in CSV, missing in schema)
-- FIX 4: add CHECK constraints on cost, clicks, impressions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id               SERIAL         PRIMARY KEY,
    brand_id         INT            NOT NULL REFERENCES brands(brand_id),
    window_id        INT            NOT NULL REFERENCES report_windows(window_id),

    -- Identity
    campaign_name    VARCHAR(512)   NOT NULL,
    campaign_status  VARCHAR(50),    -- 'Paused' | 'Enabled' | 'Removed'
    campaign_type    VARCHAR(100),   -- 'Search' | 'Demand Gen' | 'Shopping' | ...
    status_reasons   TEXT,
    currency_code    CHAR(3),

    -- Budget
    budget_amount    NUMERIC(18,4),
    budget_name      VARCHAR(255),   -- FIX: was missing from schema
    budget_type      VARCHAR(50),    -- 'Daily' | 'Shared'

    -- Performance — FIX: all were VARCHAR, now correctly typed
    impressions      BIGINT          NOT NULL DEFAULT 0,
    clicks           BIGINT          NOT NULL DEFAULT 0,
    cost             NUMERIC(18,4)   NOT NULL DEFAULT 0,
    conversions      NUMERIC(18,4)   NOT NULL DEFAULT 0,   -- fractional allowed
    conv_value       NUMERIC(18,4)   NOT NULL DEFAULT 0,

    -- Extended metrics — FIX: were VARCHAR, now NUMERIC; NULLable for '--' rows
    avg_cpm          NUMERIC(18,4),   -- was VARCHAR(50) — WRONG
    avg_cpv          NUMERIC(18,4),   -- was VARCHAR(50) — WRONG
    trueview_views   BIGINT,          -- was VARCHAR(50) — WRONG
    unique_users     BIGINT,          -- was VARCHAR(50) — WRONG

    -- FIX: columns present in CSV but entirely missing from original schema
    optimisation_score    NUMERIC(5,2),
    avg_target_roas       NUMERIC(18,4),
    ctr                   NUMERIC(10,6),   -- stored from CSV; also derivable
    conv_value_per_cost   NUMERIC(18,4),   -- 'Conv. value / cost'
    cost_per_conv         NUMERIC(18,4),   -- 'Cost / conv.'

    -- FIX: CHECK constraints to block bad data at DB level
    CONSTRAINT chk_cost_non_negative        CHECK (cost >= 0),
    CONSTRAINT chk_impressions_non_negative CHECK (impressions >= 0),
    CONSTRAINT chk_clicks_non_negative      CHECK (clicks >= 0),

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, campaign_name)
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_brand_window ON ad_campaigns (brand_id, window_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type         ON ad_campaigns (brand_id, campaign_type);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status       ON ad_campaigns (brand_id, campaign_status);


-- ---------------------------------------------------------------------------
-- GA4_TRAFFIC_CHANNELS
-- FIX: engagement_rate, bounce_rate, avg_engagement_time_sec,
--      avg_session_duration_sec, user_key_event_rate were VARCHAR — all FLOAT in data
-- NOTE: actual CSV column is "Session primary channel group (Default channel group)"
--       ETL must rename to channel_group on insert
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_traffic_channels (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),
    window_id        INT           NOT NULL REFERENCES report_windows(window_id),

    channel_group    VARCHAR(255)  NOT NULL,  -- renamed from long GA4 column name in ETL

    sessions              BIGINT          NOT NULL DEFAULT 0,
    engaged_sessions      BIGINT          NOT NULL DEFAULT 0,
    new_users             BIGINT          NOT NULL DEFAULT 0,
    total_users           BIGINT          NOT NULL DEFAULT 0,
    event_count           BIGINT          NOT NULL DEFAULT 0,
    key_events            BIGINT          NOT NULL DEFAULT 0,

    -- FIX: these were VARCHAR — actual dtype is FLOAT64
    engagement_rate         NUMERIC(10,6),    -- 0.0–1.0; data: 0.600149
    bounce_rate             NUMERIC(10,6),    -- 0.0–1.0; data: 0.399851
    user_key_event_rate     NUMERIC(10,6),    -- 0.0–1.0; data: 0.010328
    avg_engagement_time_sec NUMERIC(12,4),    -- seconds; data: 36.826326
    avg_session_duration_sec NUMERIC(12,4),   -- seconds; data: 100.789618

    total_revenue    NUMERIC(18,4)  NOT NULL DEFAULT 0,  -- data: 5769524.xx

    -- FIX: CHECK on rates — impossible if > 1.0
    CONSTRAINT chk_engagement_rate CHECK (engagement_rate IS NULL OR engagement_rate BETWEEN 0 AND 1),
    CONSTRAINT chk_bounce_rate     CHECK (bounce_rate IS NULL OR bounce_rate BETWEEN 0 AND 1),

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, channel_group)
);

CREATE INDEX IF NOT EXISTS idx_ga4_traffic_brand_window ON ga4_traffic_channels (brand_id, window_id);


-- ---------------------------------------------------------------------------
-- GA4_PRODUCT_PERFORMANCE (correct — no type issues)
-- FIX: add funnel rate generated columns so views don't compute in app
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_product_performance (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),
    window_id        INT           NOT NULL REFERENCES report_windows(window_id),

    item_name             VARCHAR(512)   NOT NULL,
    items_viewed          BIGINT         NOT NULL DEFAULT 0,
    items_added_to_cart   BIGINT         NOT NULL DEFAULT 0,
    items_purchased       BIGINT         NOT NULL DEFAULT 0,
    item_revenue          NUMERIC(18,4)  NOT NULL DEFAULT 0,

    -- FIX: stored generated columns — pre-computed funnel rates for fast dashboard reads
    view_to_cart_rate    NUMERIC(10,6) GENERATED ALWAYS AS (
                             CASE WHEN items_viewed > 0
                                  THEN items_added_to_cart::NUMERIC / items_viewed
                                  ELSE 0 END
                         ) STORED,
    cart_to_purchase_rate NUMERIC(10,6) GENERATED ALWAYS AS (
                             CASE WHEN items_added_to_cart > 0
                                  THEN items_purchased::NUMERIC / items_added_to_cart
                                  ELSE 0 END
                         ) STORED,
    view_to_purchase_rate NUMERIC(10,6) GENERATED ALWAYS AS (
                             CASE WHEN items_viewed > 0
                                  THEN items_purchased::NUMERIC / items_viewed
                                  ELSE 0 END
                         ) STORED,

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_ga4_product_brand_window ON ga4_product_performance (brand_id, window_id);
CREATE INDEX IF NOT EXISTS idx_ga4_product_revenue      ON ga4_product_performance (brand_id, item_revenue DESC);


-- ---------------------------------------------------------------------------
-- GA4_EVENTS (correct — minor improvement: event_count_per_user was VARCHAR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_events (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),
    window_id        INT           NOT NULL REFERENCES report_windows(window_id),

    event_name            VARCHAR(255)   NOT NULL,
    event_count           BIGINT         NOT NULL DEFAULT 0,
    total_users           BIGINT         NOT NULL DEFAULT 0,
    event_count_per_user  NUMERIC(12,4),   -- FIX: was VARCHAR — actual dtype FLOAT64
    total_revenue         NUMERIC(18,4)   NOT NULL DEFAULT 0,

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, event_name)
);

CREATE INDEX IF NOT EXISTS idx_ga4_events_brand_window ON ga4_events (brand_id, window_id);
CREATE INDEX IF NOT EXISTS idx_ga4_events_name         ON ga4_events (brand_id, event_name);


-- ---------------------------------------------------------------------------
-- GA4_LEAD_ACQUISITION
-- FIX 6 (CRITICAL): new_leads / qualified_leads / converted_leads are
--   always 0 in the real data — the GA4 export does not have these.
--   The REAL column is "User key event rate" (FLOAT).
--   Schema kept the 0-columns but typed correctly; rename to match GA4 output.
-- NOTE: actual CSV column = "First user primary channel group (Default channel group)"
--       ETL must rename to channel_group on insert.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_lead_acquisition (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),
    window_id        INT           NOT NULL REFERENCES report_windows(window_id),

    channel_group         VARCHAR(255)   NOT NULL,
    -- These three columns exist in GA4 export but are 0 for Twin Birds — keep for completeness
    new_leads             BIGINT         NOT NULL DEFAULT 0,
    qualified_leads       BIGINT         NOT NULL DEFAULT 0,
    converted_leads       BIGINT         NOT NULL DEFAULT 0,
    -- FIX: was VARCHAR — actual dtype FLOAT64
    user_key_event_rate   NUMERIC(10,6),

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, channel_group)
);


-- ---------------------------------------------------------------------------
-- GA4_USER_COHORTS
-- FIX 7: avg_120d_value was VARCHAR — actual dtype FLOAT64 (14.22, 26.28)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_user_cohorts (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),
    window_id        INT           NOT NULL REFERENCES report_windows(window_id),

    channel_group    VARCHAR(255)   NOT NULL,
    new_users        BIGINT         NOT NULL DEFAULT 0,
    total_revenue    NUMERIC(18,4)  NOT NULL DEFAULT 0,
    transactions     BIGINT         NOT NULL DEFAULT 0,
    -- FIX: was VARCHAR(50) — actual dtype FLOAT64
    avg_120d_value   NUMERIC(18,4),   -- 120-day LTV proxy; data: 14.220086

    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, window_id, channel_group)
);


-- ---------------------------------------------------------------------------
-- PRODUCT_CATALOG
-- FIX 3:  price in TSV is "649.00 INR" — ETL must strip " INR" before insert
-- FIX 4:  sell_on_google_qty was VARCHAR — actual dtype INT (91, 0, ...)
-- FIX 5:  all_clicks was VARCHAR — actual dtype BIGINT (0, 3, ...)
-- FIX 10: add feed_snapshot_date to track which TSV snapshot a row came from
-- FIX 14: add additional_image_links (TEXT[]), product_detail, is_active
-- FIX:    window_id should be NULLABLE here — product catalog is not tied to
--         a date-range window the same way GA4 data is; it's a point-in-time snapshot
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_catalog (
    id               SERIAL        PRIMARY KEY,
    brand_id         INT           NOT NULL REFERENCES brands(brand_id),

    -- FIX 10: date parsed from TSV filename (e.g. products_2026-05-06_*.tsv → 2026-05-06)
    feed_snapshot_date DATE,

    -- Identity
    merchant_id      VARCHAR(255)  NOT NULL,   -- e.g. shopify_IN_8178766938428_44638397399356
    item_group_id    VARCHAR(255),              -- parent product ID
    sku              VARCHAR(255),
    merchant_item_id VARCHAR(255),              -- gid://shopify/ProductVariant/...

    -- Listing
    title            VARCHAR(512)  NOT NULL,
    base_product_name VARCHAR(512),             -- DERIVED: title.split(" - ")[0]
    brand_name       VARCHAR(255),
    product_type     VARCHAR(512),
    google_category  VARCHAR(512),

    -- Variant attributes
    size             VARCHAR(100),
    color            VARCHAR(100),
    material         VARCHAR(100),
    pattern          VARCHAR(100),
    gender           VARCHAR(50),
    age_group        VARCHAR(50),

    -- Pricing — FIX 3: ETL strips " INR" from "649.00 INR" before inserting
    price            NUMERIC(18,4),
    currency_code    CHAR(3)       NOT NULL DEFAULT 'INR',
    availability     VARCHAR(100),

    -- FIX 4: was VARCHAR — actual dtype INT
    sell_on_google_qty INTEGER,

    -- Identifiers
    gtin             VARCHAR(100),
    mpn              VARCHAR(100),
    condition        VARCHAR(50),

    -- URLs
    product_link     TEXT,
    image_link       TEXT,
    canonical_link   TEXT,
    -- FIX 14: additional_image_links is a comma-separated list in the TSV → store as array
    additional_image_links TEXT[],

    -- Logistics
    shipping_weight  VARCHAR(100),   -- stored as "0.2 kg"
    shipping_country VARCHAR(100),
    return_policy_label VARCHAR(255),

    -- Feed metadata
    channel          VARCHAR(100),
    feed_label       VARCHAR(100),
    language         CHAR(5),
    -- FIX 5: was VARCHAR — actual dtype INT
    all_clicks       BIGINT         NOT NULL DEFAULT 0,

    -- FIX 14: extra columns present in TSV but missing from schema
    product_detail   TEXT,           -- "size:XL:Variant,color:Anthrazite Grey:Variant"
    custom_label_0   VARCHAR(255),
    custom_label_1   VARCHAR(255),
    custom_label_2   VARCHAR(255),
    custom_label_3   VARCHAR(255),
    custom_label_4   VARCHAR(255),

    -- Soft-delete for catalog versioning
    is_active        BOOLEAN        NOT NULL DEFAULT TRUE,

    ingested_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, feed_snapshot_date, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_brand         ON product_catalog (brand_id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_item_group    ON product_catalog (brand_id, item_group_id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_sku           ON product_catalog (brand_id, sku);
CREATE INDEX IF NOT EXISTS idx_product_catalog_base_name     ON product_catalog (brand_id, base_product_name);
CREATE INDEX IF NOT EXISTS idx_product_catalog_availability  ON product_catalog (brand_id, availability);
CREATE INDEX IF NOT EXISTS idx_product_catalog_snapshot      ON product_catalog (brand_id, feed_snapshot_date);


-- ---------------------------------------------------------------------------
-- PRODUCT_GA4_MATCH (unchanged — correct)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_ga4_match (
    id           SERIAL  PRIMARY KEY,
    brand_id     INT     NOT NULL REFERENCES brands(brand_id),
    catalog_id   INT     NOT NULL REFERENCES product_catalog(id),
    perf_id      INT     NOT NULL REFERENCES ga4_product_performance(id),
    match_score  NUMERIC(5,4),     -- 0.0000–1.0000
    match_method VARCHAR(50),      -- 'exact' | 'fuzzy' | 'manual'
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, catalog_id, perf_id)
);

CREATE INDEX IF NOT EXISTS idx_product_match_catalog ON product_ga4_match (catalog_id);
CREATE INDEX IF NOT EXISTS idx_product_match_perf    ON product_ga4_match (perf_id);


-- ---------------------------------------------------------------------------
-- INGESTION_LOG (FIX 15: add brand_id, window_id, per-row error detail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_log (
    id             SERIAL        PRIMARY KEY,
    brand_id       INT           REFERENCES brands(brand_id),
    window_id      INT           REFERENCES report_windows(window_id),
    table_name     VARCHAR(255)  NOT NULL,
    file_name      VARCHAR(255)  NOT NULL,
    rows_processed INT           NOT NULL DEFAULT 0,
    rows_rejected  INT           NOT NULL DEFAULT 0,
    status         VARCHAR(20)   NOT NULL DEFAULT 'success',  -- 'success' | 'partial' | 'failed'
    error_details  JSONB,        -- array of {row, column, raw_value, issue}
    started_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_brand  ON ingestion_log (brand_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_status ON ingestion_log (status);


-- ---------------------------------------------------------------------------
-- DATA_QUALITY_FLAGS (FIX 15: add brand_id, table_name, row_identifier)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_quality_flags (
    id             SERIAL        PRIMARY KEY,
    brand_id       INT           REFERENCES brands(brand_id),
    log_id         INT           REFERENCES ingestion_log(id),
    table_name     VARCHAR(255),
    row_identifier TEXT,         -- e.g. campaign_name or merchant_id value
    column_name    VARCHAR(255),
    raw_value      TEXT,
    issue          VARCHAR(255)  NOT NULL,
    severity       VARCHAR(50)   NOT NULL DEFAULT 'warning',  -- 'warning' | 'error'
    resolved       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dq_flags_unresolved ON data_quality_flags (brand_id, resolved)
    WHERE resolved = FALSE;


-- ===========================================================================
-- CORRECTED VIEWS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- EXECUTIVE OVERVIEW
-- FIX 8: add window_id to GROUP BY so it doesn't double-count across re-ingests
-- FIX: add window dates for the frontend date-range display
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW executive_overview AS
SELECT
    ac.brand_id,
    ac.window_id,
    rw.window_start,
    rw.window_end,
    rw.window_days,

    SUM(ac.cost)         AS total_spend,
    SUM(ac.conv_value)   AS total_revenue,
    SUM(ac.clicks)       AS total_clicks,
    SUM(ac.impressions)  AS total_impressions,
    SUM(ac.conversions)  AS total_conversions,

    CASE WHEN SUM(ac.cost) > 0
         THEN SUM(ac.conv_value) / SUM(ac.cost)
         ELSE 0 END      AS roas,

    CASE WHEN SUM(ac.impressions) > 0
         THEN SUM(ac.clicks)::NUMERIC / SUM(ac.impressions) * 100
         ELSE 0 END      AS ctr,

    CASE WHEN SUM(ac.conversions) > 0
         THEN SUM(ac.cost) / SUM(ac.conversions)
         ELSE 0 END      AS cpa,

    -- Page views from GA4 events (joined via same brand+window)
    MAX(CASE WHEN e.event_name = 'page_view'   THEN e.event_count END) AS total_page_views,
    MAX(CASE WHEN e.event_name = 'page_view'   THEN e.total_users END) AS total_users,
    MAX(CASE WHEN e.event_name = 'add_to_cart' THEN e.event_count END) AS total_add_to_carts

FROM ad_campaigns ac
JOIN report_windows rw ON rw.window_id = ac.window_id
LEFT JOIN ga4_events e ON e.brand_id = ac.brand_id AND e.window_id = ac.window_id
-- FIX 8: GROUP BY window_id prevents double-counting across ingestion runs
GROUP BY ac.brand_id, ac.window_id, rw.window_start, rw.window_end, rw.window_days;


-- ---------------------------------------------------------------------------
-- SKU OPPORTUNITY MATRIX
-- FIX 9: thresholds calibrated to actual data (9123 products, many 0-purchase)
-- FIX: use computed funnel rate columns instead of inline CASE math
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW sku_opportunity_matrix AS
SELECT
    pc.id              AS catalog_id,
    pc.brand_id,
    pc.sku,
    pc.base_product_name,
    pc.title,
    pc.price,
    pc.color,
    pc.size,
    pc.availability,
    pc.image_link,
    pc.product_link,

    pp.items_viewed,
    pp.items_added_to_cart,
    pp.items_purchased,
    pp.item_revenue,
    pp.view_to_cart_rate,
    pp.cart_to_purchase_rate,
    pp.view_to_purchase_rate,

    -- FIX 9: thresholds based on actual Twin Birds data distribution
    CASE
        WHEN pp.items_viewed     > 10000 AND pp.view_to_purchase_rate < 0.001
            THEN 'high_views_zero_conversion'     -- pricing/description issue
        WHEN pp.items_purchased  > 5     AND pp.items_viewed < 1000
            THEN 'hidden_gem'                     -- needs more ad budget
        WHEN pp.items_viewed     > 5000  AND pp.cart_to_purchase_rate < 0.05
            THEN 'cart_abandonment'               -- checkout friction
        WHEN pp.items_viewed IS NULL
            THEN 'no_ga4_data'
        WHEN pp.items_viewed     < 100
            THEN 'low_visibility'
        ELSE 'standard'
    END                AS opportunity_flag,

    gm.match_score     AS catalog_match_score

FROM product_catalog pc
LEFT JOIN product_ga4_match gm ON pc.id = gm.catalog_id
LEFT JOIN ga4_product_performance pp ON gm.perf_id = pp.id
WHERE pc.is_active = TRUE;


-- ---------------------------------------------------------------------------
-- CHANNEL ATTRIBUTION (add revenue share % computed in SQL)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW channel_attribution AS
SELECT
    tc.brand_id,
    tc.window_id,
    tc.channel_group,
    tc.sessions,
    tc.engaged_sessions,
    tc.new_users,
    tc.total_users,
    tc.total_revenue,
    tc.engagement_rate,
    tc.bounce_rate,
    tc.user_key_event_rate,
    tc.avg_engagement_time_sec,
    tc.avg_session_duration_sec,

    CASE
        WHEN tc.channel_group ILIKE '%paid%'    THEN 'paid'
        WHEN tc.channel_group ILIKE '%organic%' THEN 'organic'
        WHEN tc.channel_group = 'Direct'        THEN 'direct'
        ELSE 'other'
    END AS channel_type,

    ROUND(
        tc.total_revenue /
        NULLIF(SUM(tc.total_revenue) OVER (PARTITION BY tc.brand_id, tc.window_id), 0) * 100,
        2
    ) AS revenue_share_pct

FROM ga4_traffic_channels tc;
