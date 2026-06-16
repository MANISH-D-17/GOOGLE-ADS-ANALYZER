import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
conn = psycopg2.connect(os.environ.get("AIVEN_PG_URI"))
conn.autocommit = True
cur = conn.cursor()

print("Running exact match via PostgreSQL...")
cur.execute("""
    INSERT INTO product_ga4_match (brand_id, catalog_id, perf_id, match_score, match_method)
    SELECT 
        1, pc.id, pp.id, 1.0, 'exact_sql'
    FROM product_catalog pc
    JOIN ga4_product_performance pp 
      ON LOWER(TRIM(pc.base_product_name)) = LOWER(TRIM(pp.item_name))
    ON CONFLICT DO NOTHING;
""")

queries = {
    "ad_campaigns": "SELECT COUNT(*) FROM ad_campaigns",
    "ga4_product_performance": "SELECT COUNT(*) FROM ga4_product_performance",
    "product_catalog": "SELECT COUNT(*) FROM product_catalog",
    "product_ga4_match": "SELECT COUNT(*) FROM product_ga4_match",
    "executive_overview": "SELECT * FROM executive_overview WHERE brand_id = 1",
    "sku_opportunity_matrix flags": "SELECT opportunity_flag, COUNT(*) FROM sku_opportunity_matrix GROUP BY opportunity_flag"
}

print("\n--- Final Counts ---")
for name, query in queries.items():
    cur.execute(query)
    print(f"{name}:")
    for row in cur.fetchall():
        print(row)
