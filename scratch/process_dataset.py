import csv
import json
import os
import re

# Paths
DATASET_DIR = "/Users/manishd/MANISH-PROJECT/GADS/Dataset"
OUTPUT_DIR = "/Users/manishd/MANISH-PROJECT/GADS/src/data/actual"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def clean_value(val):
    if not val: return 0
    # Remove quotes, commas, currency symbols
    cleaned = re.sub(r'[^\d.]', '', val.replace('"', '').replace(',', ''))
    try:
        return float(cleaned) if '.' in cleaned else int(cleaned)
    except:
        return 0

def process_campaigns():
    campaign_file = os.path.join(DATASET_DIR, "Campaign report_twin birds.csv")
    campaigns = []
    
    # This file is UTF-16 with tab separation (despite .csv extension)
    with open(campaign_file, 'r', encoding='utf-16') as f:
        # Skip header lines if they exist
        lines = f.readlines()
        # Find where the actual data starts
        start_idx = 0
        for i, line in enumerate(lines):
            if "Campaign status" in line:
                start_idx = i
                break
        
        reader = csv.DictReader(lines[start_idx:], delimiter='\t')
        for row in reader:
            if not row.get('Campaign'): continue
            
            campaigns.append({
                'name': row['Campaign'],
                'status': row['Campaign status'],
                'type': row['Campaign type'],
                'spend': clean_value(row.get('Cost', '0')),
                'revenue': clean_value(row.get('Conv. value', '0')),
                'conversions': clean_value(row.get('Conversions', '0')),
                'clicks': clean_value(row.get('Clicks', '0')),
                'impressions': clean_value(row.get('Impr.', '0')),
                'roas': clean_value(row.get('Conv. value / cost', '0')),
                'ctr': row.get('CTR', '0%').replace('%', ''),
            })
            
    with open(os.path.join(OUTPUT_DIR, "campaigns.json"), 'w') as f:
        json.dump(campaigns, f, indent=2)
    return campaigns

def process_products():
    product_file = os.path.join(DATASET_DIR, "products_2026-05-06_10-16-38.tsv")
    skus = []
    
    with open(product_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            # Basic SKU info
            sku_id = row.get('id', '')
            if not sku_id: continue
            
            # Map attributes for feed health
            attributes = []
            quality_counts = {'good': 0, 'warning': 0, 'critical': 0}
            
            fields_to_check = ['title', 'description', 'image_link', 'price', 'availability', 'product_type', 'gtin']
            for field in fields_to_check:
                val = row.get(field, '')
                quality = 'good'
                issue = None
                
                if not val:
                    quality = 'critical'
                    issue = f"Missing {field}"
                elif field == 'title' and len(val) < 50:
                    quality = 'warning'
                    issue = "Short title"
                elif field == 'description' and len(val) < 100:
                    quality = 'warning'
                    issue = "Short description"
                
                quality_counts[quality] += 1
                attributes.append({
                    'field': field,
                    'value': val,
                    'quality': quality,
                    'issue': issue
                })

            skus.append({
                'id': sku_id,
                'name': row.get('title', 'Unknown Product'),
                'category': row.get('product_type', 'Uncategorized'),
                'availability': row.get('availability', 'out of stock').replace(' ', '_'),
                'price': row.get('price', '0 INR'),
                'attributes': attributes,
                'status': 'active' if quality_counts['critical'] == 0 else 'disapproved'
            })
            
    # Limit for performance in UI if needed, but the user wants 100% accurate
    # We'll save the full list
    with open(os.path.join(OUTPUT_DIR, "products.json"), 'w') as f:
        json.dump(skus, f, indent=2)
    return skus

if __name__ == "__main__":
    process_campaigns()
    process_products()
    print("Data processed successfully.")
