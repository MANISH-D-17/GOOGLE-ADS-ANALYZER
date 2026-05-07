import csv
import json

def audit_data():
    results = {}
    
    # 1. CAMPAIGN AUDIT
    try:
        with open('Dataset/Campaign report_twin birds.csv', 'r', encoding='utf-16') as f:
            lines = f.readlines()
        
        header = None
        total_row = None
        
        for line in lines:
            line = line.strip()
            if not line: continue
            if 'Campaign status' in line and 'Campaign' in line:
                header = line.split('\t')
            elif line.startswith('--'):
                total_row = line.split('\t')
        
        if not header:
            print("HEADER NOT FOUND")
        if not total_row:
            print("TOTAL ROW NOT FOUND")

        if header and total_row:
            def get_idx(name): return header.index(name)
            def clean_num(v): 
                v = v.replace('"', '').replace(',', '').replace(' ', '')
                return float(v) if v and v != '--' else 0.0

            results['google_ads'] = {
                'spend': clean_num(total_row[get_idx('Cost')]),
                'revenue': clean_num(total_row[get_idx('Conv. value')]),
                'conversions': clean_num(total_row[get_idx('Conversions')]),
                'clicks': clean_num(total_row[get_idx('Clicks')]),
                'impressions': clean_num(total_row[get_idx('Impr.')])
            }
            results['google_ads']['roas'] = results['google_ads']['revenue'] / results['google_ads']['spend'] if results['google_ads']['spend'] > 0 else 0
    except Exception as e:
        results['google_ads_error'] = str(e)

    # 2. SKU AUDIT
    try:
        with open('src/data/actual/products.json', 'r') as f:
            products = json.load(f)
        results['inventory'] = {
            'total_skus': len(products),
            'out_of_stock': len([p for p in products if 'out' in p.get('availability', '').lower()]),
            'in_stock': len([p for p in products if 'in' in p.get('availability', '').lower()])
        }
    except Exception as e:
        results['inventory_error'] = str(e)

    # 3. GA4 AUDIT
    try:
        with open('Dataset/User_acquisition_cohorts_Ga4 Twinbirds.csv', 'r') as f:
            lines = f.readlines()
        
        total_ga4_rev = 0
        for line in lines[12:]:
            parts = line.strip().split(',')
            if len(parts) >= 3:
                try: total_ga4_rev += float(parts[2].replace('"', ''))
                except: continue
        
        results['ga4'] = { 'total_revenue': round(total_ga4_rev, 2) }
        if 'google_ads' in results:
            results['ga4']['gap_pct'] = round((1 - (results['google_ads']['revenue'] / total_ga4_rev)) * 100, 2)
    except Exception as e:
        results['ga4_error'] = str(e)

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    audit_data()
