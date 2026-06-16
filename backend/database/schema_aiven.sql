-- Core Tables
CREATE TABLE IF NOT EXISTS brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    brand_slug VARCHAR(255) UNIQUE NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS report_windows (
    window_id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    UNIQUE (brand_id, window_start, window_end, source)
);

-- Google Ads
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    campaign_name VARCHAR(512) NOT NULL,
    campaign_status VARCHAR(50),
    campaign_type VARCHAR(100),
    status_reasons TEXT,
    budget_amount NUMERIC,
    budget_type VARCHAR(50),
    currency_code VARCHAR(3),
    impressions BIGINT,
    clicks BIGINT,
    cost NUMERIC,
    conversions NUMERIC,
    conv_value NUMERIC,
    avg_cpm VARCHAR(50),
    avg_cpv VARCHAR(50),
    trueview_views VARCHAR(50),
    unique_users VARCHAR(50),
    UNIQUE (brand_id, window_id, campaign_name)
);

-- GA4 Tables
CREATE TABLE IF NOT EXISTS ga4_traffic_channels (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    channel_group VARCHAR(255) NOT NULL,
    sessions BIGINT,
    engaged_sessions BIGINT,
    new_users BIGINT,
    total_users BIGINT,
    engagement_rate VARCHAR(50),
    avg_engagement_time_sec VARCHAR(50),
    event_count BIGINT,
    key_events BIGINT,
    user_key_event_rate VARCHAR(50),
    total_revenue NUMERIC,
    bounce_rate VARCHAR(50),
    avg_session_duration_sec VARCHAR(50),
    UNIQUE (brand_id, window_id, channel_group)
);

CREATE TABLE IF NOT EXISTS ga4_product_performance (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    item_name VARCHAR(512) NOT NULL,
    items_viewed BIGINT,
    items_added_to_cart BIGINT,
    items_purchased BIGINT,
    item_revenue NUMERIC,
    UNIQUE (brand_id, window_id, item_name)
);

CREATE TABLE IF NOT EXISTS ga4_events (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    event_name VARCHAR(255) NOT NULL,
    event_count BIGINT,
    total_users BIGINT,
    event_count_per_user VARCHAR(50),
    total_revenue NUMERIC,
    UNIQUE (brand_id, window_id, event_name)
);

CREATE TABLE IF NOT EXISTS ga4_lead_acquisition (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    channel_group VARCHAR(255) NOT NULL,
    new_leads BIGINT,
    qualified_leads BIGINT,
    converted_leads BIGINT,
    user_key_event_rate VARCHAR(50),
    UNIQUE (brand_id, window_id, channel_group)
);

CREATE TABLE IF NOT EXISTS ga4_user_cohorts (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    channel_group VARCHAR(255) NOT NULL,
    new_users BIGINT,
    total_revenue NUMERIC,
    transactions BIGINT,
    avg_120d_value VARCHAR(50),
    UNIQUE (brand_id, window_id, channel_group)
);

-- Product Catalog
CREATE TABLE IF NOT EXISTS product_catalog (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    window_id INT REFERENCES report_windows(window_id),
    merchant_id VARCHAR(255) NOT NULL,
    item_group_id VARCHAR(255),
    sku VARCHAR(255),
    merchant_item_id VARCHAR(255),
    title VARCHAR(512),
    base_product_name VARCHAR(512),
    brand_name VARCHAR(255),
    product_type VARCHAR(512),
    google_category VARCHAR(512),
    size VARCHAR(100),
    color VARCHAR(100),
    material VARCHAR(100),
    pattern VARCHAR(100),
    gender VARCHAR(50),
    age_group VARCHAR(50),
    price NUMERIC,
    currency_code VARCHAR(10),
    availability VARCHAR(100),
    sell_on_google_qty VARCHAR(50),
    gtin VARCHAR(100),
    mpn VARCHAR(100),
    condition VARCHAR(50),
    product_link TEXT,
    image_link TEXT,
    canonical_link TEXT,
    shipping_weight VARCHAR(100),
    shipping_country VARCHAR(100),
    return_policy_label VARCHAR(255),
    channel VARCHAR(100),
    feed_label VARCHAR(100),
    language VARCHAR(50),
    all_clicks VARCHAR(50),
    UNIQUE (brand_id, window_id, merchant_id)
);

CREATE TABLE IF NOT EXISTS product_ga4_match (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(brand_id),
    catalog_id INT REFERENCES product_catalog(id),
    perf_id INT REFERENCES ga4_product_performance(id),
    match_score NUMERIC,
    match_method VARCHAR(50),
    UNIQUE (brand_id, catalog_id, perf_id)
);

-- Ops tables
CREATE TABLE IF NOT EXISTS ingestion_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255),
    file_name VARCHAR(255),
    rows_processed INT,
    errors INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_quality_flags (
    id SERIAL PRIMARY KEY,
    issue VARCHAR(255),
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Views
CREATE OR REPLACE VIEW executive_overview AS
SELECT 
    rw.brand_id,
    SUM(ac.cost) as total_spend,
    SUM(ac.conv_value) as total_revenue,
    SUM(ac.clicks) as total_clicks,
    SUM(ac.impressions) as total_impressions,
    SUM(ac.conversions) as total_conversions,
    CASE WHEN SUM(ac.cost) > 0 THEN SUM(ac.conv_value) / SUM(ac.cost) ELSE 0 END as roas,
    CASE WHEN SUM(ac.impressions) > 0 THEN (SUM(ac.clicks)::numeric / SUM(ac.impressions)::numeric) * 100 ELSE 0 END as ctr
FROM ad_campaigns ac
JOIN report_windows rw ON ac.window_id = rw.window_id
GROUP BY rw.brand_id;

CREATE OR REPLACE VIEW sku_opportunity_matrix AS
SELECT 
    pc.id as catalog_id,
    pc.sku,
    pc.base_product_name,
    pc.price,
    pp.items_viewed,
    pp.items_added_to_cart,
    pp.items_purchased,
    pp.item_revenue,
    CASE 
        WHEN pp.items_viewed > 100 AND pp.items_purchased = 0 THEN 'high_view_no_buy'
        WHEN pp.items_purchased > 5 AND pp.items_viewed < 50 THEN 'hidden_gem'
        WHEN pp.items_viewed IS NULL THEN 'no_data'
        ELSE 'standard'
    END as opportunity_flag
FROM product_catalog pc
LEFT JOIN product_ga4_match gm ON pc.id = gm.catalog_id
LEFT JOIN ga4_product_performance pp ON gm.perf_id = pp.id;

CREATE OR REPLACE VIEW channel_attribution AS
SELECT 
    tc.brand_id,
    tc.channel_group,
    tc.sessions,
    tc.engaged_sessions,
    tc.total_revenue,
    tc.engagement_rate,
    tc.bounce_rate
FROM ga4_traffic_channels tc;
