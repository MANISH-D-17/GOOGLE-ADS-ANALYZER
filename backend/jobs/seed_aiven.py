import os
import psycopg2
from psycopg2 import sql, extras
import pandas as pd
from rapidfuzz import fuzz
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def get_connection():
    uri = os.environ.get("AIVEN_PG_URI")
    if uri:
        return psycopg2.connect(uri)
    return psycopg2.connect(
        host=os.environ["AIVEN_HOST"],
        port=int(os.environ["AIVEN_PORT"]),
        dbname=os.environ.get("AIVEN_DB", "defaultdb"),
        user=os.environ.get("AIVEN_USER", "avnadmin"),
        password=os.environ["AIVEN_PASSWORD"],
        sslmode="require"
    )

def log_ingestion(cursor, table_name, file_name, rows_processed, errors=0):
    cursor.execute("""
        INSERT INTO ingestion_log (table_name, file_name, rows_processed, errors)
        VALUES (%s, %s, %s, %s)
    """, (table_name, file_name, rows_processed, errors))

def flag_issue(cursor, issue, severity):
    cursor.execute("""
        INSERT INTO data_quality_flags (issue, severity)
        VALUES (%s, %s)
    """, (issue, severity))

def execute_schema(cursor):
    print("Executing schema...")
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema_aiven.sql')
    with open(schema_path, 'r') as f:
        cursor.execute(f.read())

def seed_base_data(cursor):
    print("Seeding base data...")
    cursor.execute("""
        INSERT INTO brands (brand_name, brand_slug, country_code, currency_code)
        VALUES ('Twin Birds', 'twin_birds', 'IN', 'INR')
        ON CONFLICT (brand_slug) DO NOTHING
    """)
    # Assuming brand_id=1 exists
    cursor.execute("""
        INSERT INTO report_windows (brand_id, window_start, window_end, source)
        VALUES 
            (1, '2025-11-01', '2026-04-30', 'google_ads'),
            (1, '2025-11-01', '2026-04-30', 'ga4'),
            (1, '2026-05-06', '2026-05-06', 'merchant_center')
        ON CONFLICT (brand_id, window_start, window_end, source) DO NOTHING
    """)

def process_campaigns(cursor, file_path):
    print("Processing ad campaigns...")
    df = pd.read_csv(file_path, sep='\t', encoding='utf-16le', skiprows=2)
    # Drop total rows
    df = df.dropna(subset=['Campaign'])
    df = df[~df['Campaign status'].astype(str).str.contains('Total', case=False, na=False)]
    df = df[~df['Campaign'].astype(str).str.contains('Total', case=False, na=False)]
    
    # Replace '--' or ' --' with None/NaN
    df = df.replace(r'^\s*--\s*$', None, regex=True)
    
    # Clean CTR
    if 'CTR' in df.columns:
        df['CTR'] = pd.to_numeric(df['CTR'].astype(str).str.replace('%', ''), errors='coerce') / 100.0

    records = []
    for _, row in df.iterrows():
        try:
            budget_amount = float(str(row.get('Budget', 0)).replace(',', '')) if pd.notna(row.get('Budget')) else None
            impressions = int(str(row.get('Impr.', 0)).replace(',', '')) if pd.notna(row.get('Impr.')) else None
            clicks = int(str(row.get('Clicks', 0)).replace(',', '')) if pd.notna(row.get('Clicks')) else None
            cost = float(str(row.get('Cost', 0)).replace(',', '')) if pd.notna(row.get('Cost')) else None
            conversions = float(str(row.get('Conversions', 0)).replace(',', '')) if pd.notna(row.get('Conversions')) else None
            conv_value = float(str(row.get('Conv. value', 0)).replace(',', '')) if pd.notna(row.get('Conv. value')) else None
        except ValueError:
            continue

        records.append((
            1, 1, # brand_id, window_id
            row.get('Campaign'), row.get('Campaign status'), row.get('Campaign type'), row.get('Status reasons'),
            budget_amount, row.get('Budget type'), row.get('Currency code'),
            impressions, clicks, cost, conversions, conv_value,
            row.get('Avg. CPM'), row.get('TrueView avg. CPV'), row.get('TrueView views'), row.get('Unique users')
        ))
    
    if records:
        insert_query = """
            INSERT INTO ad_campaigns (
                brand_id, window_id, campaign_name, campaign_status, campaign_type, status_reasons,
                budget_amount, budget_type, currency_code, impressions, clicks, cost, conversions, conv_value,
                avg_cpm, avg_cpv, trueview_views, unique_users
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, campaign_name) DO UPDATE SET
                campaign_status = EXCLUDED.campaign_status,
                campaign_type = EXCLUDED.campaign_type,
                status_reasons = EXCLUDED.status_reasons,
                budget_amount = EXCLUDED.budget_amount,
                budget_type = EXCLUDED.budget_type,
                currency_code = EXCLUDED.currency_code,
                impressions = EXCLUDED.impressions,
                clicks = EXCLUDED.clicks,
                cost = EXCLUDED.cost,
                conversions = EXCLUDED.conversions,
                conv_value = EXCLUDED.conv_value,
                avg_cpm = EXCLUDED.avg_cpm,
                avg_cpv = EXCLUDED.avg_cpv,
                trueview_views = EXCLUDED.trueview_views,
                unique_users = EXCLUDED.unique_users
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ad_campaigns', os.path.basename(file_path), len(records))

def process_traffic_channels(cursor, file_path):
    print("Processing traffic channels...")
    df = pd.read_csv(file_path, comment='#')
    df = df.dropna(subset=['Session primary channel group (Default channel group)'])
    df = df[~df['Session primary channel group (Default channel group)'].astype(str).str.contains('Total', case=False, na=False)]

    records = []
    for _, row in df.iterrows():
        try:
            sessions = int(str(row.get('Sessions', 0)).replace(',', '')) if pd.notna(row.get('Sessions')) else None
            engaged = int(str(row.get('Engaged sessions', 0)).replace(',', '')) if pd.notna(row.get('Engaged sessions')) else None
            new_u = int(str(row.get('New users', 0)).replace(',', '')) if pd.notna(row.get('New users')) else None
            tot_u = int(str(row.get('Total users', 0)).replace(',', '')) if pd.notna(row.get('Total users')) else None
            rev = float(str(row.get('Total revenue', 0)).replace(',', '')) if pd.notna(row.get('Total revenue')) else None
            events = int(str(row.get('Event count', 0)).replace(',', '')) if pd.notna(row.get('Event count')) else None
            key_events = int(str(row.get('Key events', 0)).replace(',', '')) if pd.notna(row.get('Key events')) else None
        except ValueError:
            continue

        records.append((
            1, 2, # brand_id, window_id
            row.get('Session primary channel group (Default channel group)'),
            sessions, engaged, new_u, tot_u, row.get('Engagement rate'), row.get('Average engagement time per session'),
            events, key_events, row.get('User key event rate'), rev, row.get('Bounce rate'), row.get('Average session duration')
        ))
    
    if records:
        insert_query = """
            INSERT INTO ga4_traffic_channels (
                brand_id, window_id, channel_group, sessions, engaged_sessions, new_users, total_users,
                engagement_rate, avg_engagement_time_sec, event_count, key_events, user_key_event_rate,
                total_revenue, bounce_rate, avg_session_duration_sec
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, channel_group) DO UPDATE SET
                sessions = EXCLUDED.sessions,
                engaged_sessions = EXCLUDED.engaged_sessions,
                new_users = EXCLUDED.new_users,
                total_users = EXCLUDED.total_users,
                engagement_rate = EXCLUDED.engagement_rate,
                avg_engagement_time_sec = EXCLUDED.avg_engagement_time_sec,
                event_count = EXCLUDED.event_count,
                key_events = EXCLUDED.key_events,
                user_key_event_rate = EXCLUDED.user_key_event_rate,
                total_revenue = EXCLUDED.total_revenue,
                bounce_rate = EXCLUDED.bounce_rate,
                avg_session_duration_sec = EXCLUDED.avg_session_duration_sec
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ga4_traffic_channels', os.path.basename(file_path), len(records))

def process_ecommerce(cursor, file_path):
    print("Processing ecommerce products...")
    df = pd.read_csv(file_path, comment='#')
    
    # Ensure numeric columns
    numeric_cols = ['Items viewed', 'Items added to cart', 'Items purchased', 'Item revenue']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce').fillna(0)
    
    # Group by item name
    df = df.groupby('Item name', as_index=False)[numeric_cols].sum()

    records = []
    for _, row in df.iterrows():
        records.append((
            1, 2, # brand_id, window_id
            row['Item name'], int(row['Items viewed']), int(row['Items added to cart']),
            int(row['Items purchased']), float(row['Item revenue'])
        ))
    
    if records:
        insert_query = """
            INSERT INTO ga4_product_performance (
                brand_id, window_id, item_name, items_viewed, items_added_to_cart, items_purchased, item_revenue
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, item_name) DO UPDATE SET
                items_viewed = EXCLUDED.items_viewed,
                items_added_to_cart = EXCLUDED.items_added_to_cart,
                items_purchased = EXCLUDED.items_purchased,
                item_revenue = EXCLUDED.item_revenue
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ga4_product_performance', os.path.basename(file_path), len(records))

def process_events(cursor, file_path):
    print("Processing events...")
    df = pd.read_csv(file_path, comment='#')
    
    records = []
    for _, row in df.iterrows():
        try:
            count = int(str(row.get('Event count', 0)).replace(',', '')) if pd.notna(row.get('Event count')) else None
            users = int(str(row.get('Total users', 0)).replace(',', '')) if pd.notna(row.get('Total users')) else None
            rev = float(str(row.get('Total revenue', 0)).replace(',', '')) if pd.notna(row.get('Total revenue')) else None
        except ValueError:
            continue
            
        records.append((
            1, 2, # brand_id, window_id
            row.get('Event name'), count, users, row.get('Event count per active user'), rev
        ))
    
    if records:
        insert_query = """
            INSERT INTO ga4_events (
                brand_id, window_id, event_name, event_count, total_users, event_count_per_user, total_revenue
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, event_name) DO UPDATE SET
                event_count = EXCLUDED.event_count,
                total_users = EXCLUDED.total_users,
                event_count_per_user = EXCLUDED.event_count_per_user,
                total_revenue = EXCLUDED.total_revenue
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ga4_events', os.path.basename(file_path), len(records))

def process_lead_acq(cursor, file_path):
    print("Processing lead acquisition...")
    df = pd.read_csv(file_path, comment='#')
    
    records = []
    for _, row in df.iterrows():
        try:
            new_l = int(str(row.get('New leads', 0)).replace(',', '')) if pd.notna(row.get('New leads')) else None
            qual_l = int(str(row.get('Qualified leads', 0)).replace(',', '')) if pd.notna(row.get('Qualified leads')) else None
            conv_l = int(str(row.get('Converted leads', 0)).replace(',', '')) if pd.notna(row.get('Converted leads')) else None
        except ValueError:
            continue
            
        records.append((
            1, 2, # brand_id, window_id
            row.get('First user primary channel group (Default channel group)'), new_l, qual_l, conv_l, row.get('User key event rate')
        ))
    
    if records:
        insert_query = """
            INSERT INTO ga4_lead_acquisition (
                brand_id, window_id, channel_group, new_leads, qualified_leads, converted_leads, user_key_event_rate
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, channel_group) DO UPDATE SET
                new_leads = EXCLUDED.new_leads,
                qualified_leads = EXCLUDED.qualified_leads,
                converted_leads = EXCLUDED.converted_leads,
                user_key_event_rate = EXCLUDED.user_key_event_rate
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ga4_lead_acquisition', os.path.basename(file_path), len(records))

def process_cohorts(cursor, file_path):
    print("Processing user cohorts...")
    df = pd.read_csv(file_path, comment='#')
    
    records = []
    for _, row in df.iterrows():
        try:
            new_u = int(str(row.get('New users', 0)).replace(',', '')) if pd.notna(row.get('New users')) else None
            rev = float(str(row.get('Total revenue', 0)).replace(',', '')) if pd.notna(row.get('Total revenue')) else None
            trans = int(str(row.get('Transactions', 0)).replace(',', '')) if pd.notna(row.get('Transactions')) else None
        except ValueError:
            continue
            
        records.append((
            1, 2, # brand_id, window_id
            row.get('First user primary channel group (Default channel group)'), new_u, rev, trans, row.get('Average 120d value')
        ))
    
    if records:
        insert_query = """
            INSERT INTO ga4_user_cohorts (
                brand_id, window_id, channel_group, new_users, total_revenue, transactions, avg_120d_value
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, channel_group) DO UPDATE SET
                new_users = EXCLUDED.new_users,
                total_revenue = EXCLUDED.total_revenue,
                transactions = EXCLUDED.transactions,
                avg_120d_value = EXCLUDED.avg_120d_value
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'ga4_user_cohorts', os.path.basename(file_path), len(records))

def process_product_catalog(cursor, file_path):
    print("Processing product catalog...")
    df = pd.read_csv(file_path, sep='\t', encoding='utf-8')
    
    records = []
    for _, row in df.iterrows():
        # Parse price
        price_val = None
        curr = None
        if pd.notna(row.get('price')):
            parts = str(row['price']).split(' ')
            try:
                price_val = float(parts[0])
                if len(parts) > 1:
                    curr = parts[1]
            except ValueError:
                pass
                
        # Parse title
        base_name = str(row.get('title', '')).split('-')[0].strip()
        
        records.append((
            1, 3, # brand_id, window_id
            str(row.get('id')), str(row.get('item group id')), str(row.get('sku')), str(row.get('merchant item id')),
            str(row.get('title')), base_name, str(row.get('brand')), str(row.get('product type')), str(row.get('google product category')),
            str(row.get('size')), str(row.get('color')), str(row.get('material')), str(row.get('pattern')), str(row.get('gender')),
            str(row.get('age group')), price_val, curr, str(row.get('availability')), str(row.get('sell on google quantity')),
            str(row.get('gtin')), str(row.get('mpn')), str(row.get('condition')), str(row.get('link')), str(row.get('image link')),
            str(row.get('canonical link')), str(row.get('shipping weight')), str(row.get('shipping(country)')),
            str(row.get('return policy label')), str(row.get('channel')), str(row.get('feed label')), str(row.get('language')),
            str(row.get('all clicks'))
        ))
    
    if records:
        insert_query = """
            INSERT INTO product_catalog (
                brand_id, window_id, merchant_id, item_group_id, sku, merchant_item_id, title, base_product_name, brand_name,
                product_type, google_category, size, color, material, pattern, gender, age_group, price, currency_code,
                availability, sell_on_google_qty, gtin, mpn, condition, product_link, image_link, canonical_link, shipping_weight,
                shipping_country, return_policy_label, channel, feed_label, language, all_clicks
            ) VALUES %s
            ON CONFLICT (brand_id, window_id, merchant_id) DO UPDATE SET
                item_group_id = EXCLUDED.item_group_id, sku = EXCLUDED.sku, merchant_item_id = EXCLUDED.merchant_item_id,
                title = EXCLUDED.title, base_product_name = EXCLUDED.base_product_name, brand_name = EXCLUDED.brand_name,
                product_type = EXCLUDED.product_type, google_category = EXCLUDED.google_category, size = EXCLUDED.size,
                color = EXCLUDED.color, material = EXCLUDED.material, pattern = EXCLUDED.pattern, gender = EXCLUDED.gender,
                age_group = EXCLUDED.age_group, price = EXCLUDED.price, currency_code = EXCLUDED.currency_code,
                availability = EXCLUDED.availability, sell_on_google_qty = EXCLUDED.sell_on_google_qty, gtin = EXCLUDED.gtin,
                mpn = EXCLUDED.mpn, condition = EXCLUDED.condition, product_link = EXCLUDED.product_link,
                image_link = EXCLUDED.image_link, canonical_link = EXCLUDED.canonical_link, shipping_weight = EXCLUDED.shipping_weight,
                shipping_country = EXCLUDED.shipping_country, return_policy_label = EXCLUDED.return_policy_label,
                channel = EXCLUDED.channel, feed_label = EXCLUDED.feed_label, language = EXCLUDED.language,
                all_clicks = EXCLUDED.all_clicks
        """
        extras.execute_values(cursor, insert_query, records)
        log_ingestion(cursor, 'product_catalog', os.path.basename(file_path), len(records))

def run_fuzzy_matching(cursor):
    from rapidfuzz import process
    print("Running product fuzzy matching...")
    cursor.execute("SELECT id, item_name FROM ga4_product_performance WHERE brand_id = 1")
    ga4_items = cursor.fetchall()
    
    cursor.execute("SELECT id, base_product_name FROM product_catalog WHERE brand_id = 1")
    catalog_items = cursor.fetchall()
    
    cat_dict = {cat_id: (cat_name or '').lower().strip() for cat_id, cat_name in catalog_items}
    cat_names = list(cat_dict.values())
    cat_ids = list(cat_dict.keys())
    
    records = []
    flagged = 0
    for perf_id, item_name in ga4_items:
        item_lower = (item_name or '').lower().strip()
        
        match = process.extractOne(item_lower, cat_names, scorer=fuzz.token_sort_ratio)
        if match:
            best_name, best_score, best_idx = match
            best_match_id = cat_ids[best_idx]
            
            method = 'exact' if best_score == 100 else 'fuzzy'
            records.append((1, best_match_id, perf_id, best_score / 100.0, method))
            
            if best_score < 80:
                flag_issue(cursor, f"low_match_score: GA4 '{item_name}' matched Catalog ID {best_match_id} with score {best_score}", "warning")
                flagged += 1

    if records:
        insert_query = """
            INSERT INTO product_ga4_match (
                brand_id, catalog_id, perf_id, match_score, match_method
            ) VALUES %s
            ON CONFLICT (brand_id, catalog_id, perf_id) DO UPDATE SET
                match_score = EXCLUDED.match_score,
                match_method = EXCLUDED.match_method
        """
        extras.execute_values(cursor, insert_query, records)
        print(f"Matched {len(records)} items. Flagged {flagged} items with score < 80.")

def main():
    conn = get_connection()
    conn.autocommit = False
    cursor = conn.cursor()
    
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'Dataset')
    
    try:
        execute_schema(cursor)
        seed_base_data(cursor)
        
        process_campaigns(cursor, os.path.join(dataset_dir, 'Campaign report_twin birds.csv'))
        process_traffic_channels(cursor, os.path.join(dataset_dir, 'Traffic_acquisition_Session_TwinBirds.csv'))
        process_ecommerce(cursor, os.path.join(dataset_dir, 'E-commerce_purchases_(TwinBirds GA4).csv'))
        process_events(cursor, os.path.join(dataset_dir, 'Events_Event_name(TwinBirds GA4).csv'))
        
        # User specified "Lead_acquisition_First_user_primary_TwinBirds_GA4.csv" but actually file uses spaces 
        # based on previous tool list: "Lead_acquisition_First_user_primary_TwinBirds GA4.csv"
        process_lead_acq(cursor, os.path.join(dataset_dir, 'Lead_acquisition_First_user_primary_TwinBirds GA4.csv'))
        process_cohorts(cursor, os.path.join(dataset_dir, 'User_acquisition_cohorts_Ga4 Twinbirds.csv'))
        process_product_catalog(cursor, os.path.join(dataset_dir, 'products_2026-05-06_10-16-38.tsv'))
        
        run_fuzzy_matching(cursor)
        
        conn.commit()
        print("Ingestion complete. Verifying counts...")
        
        queries = {
            "ad_campaigns": "SELECT COUNT(*) FROM ad_campaigns",
            "ga4_product_performance": "SELECT COUNT(*) FROM ga4_product_performance",
            "product_catalog": "SELECT COUNT(*) FROM product_catalog",
            "product_ga4_match": "SELECT COUNT(*) FROM product_ga4_match",
            "executive_overview": "SELECT * FROM executive_overview WHERE brand_id = 1",
            "sku_opportunity_matrix flags": "SELECT opportunity_flag, COUNT(*) FROM sku_opportunity_matrix GROUP BY opportunity_flag"
        }
        
        for name, query in queries.items():
            cursor.execute(query)
            print(f"--- {name} ---")
            for row in cursor.fetchall():
                print(row)
            print()
            
    except Exception as e:
        conn.rollback()
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
