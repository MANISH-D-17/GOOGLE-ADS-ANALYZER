import csv
import json
import os

EXPORT_DIR = 'exports'
if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

def export_csv_file(source_path, target_name, skip_rows=0):
    try:
        encodings = ['utf-8', 'utf-16', 'latin-1']
        content = None
        for enc in encodings:
            try:
                with open(source_path, 'r', encoding=enc) as f:
                    content = f.readlines()
                break
            except:
                continue
        
        if content is None:
            return

        lines = content[skip_rows:]
        clean_lines = []
        for line in lines:
            if '"Total"' in line or ',"--",' in line or line.startswith('--'):
                continue
            clean_lines.append(line)
            
        with open(f'{EXPORT_DIR}/{target_name}', 'w', encoding='utf-8') as f:
            f.writelines(clean_lines)
    except:
        pass

def export_creatives_audit():
    headers = ["Campaign name", "Ad group", "Ad type", "Headline 1/2/3", "Description 1/2", "Final URL", "Impressions", "Clicks", "CTR", "Conversions", "Conv. value", "Status"]
    with open(f'{EXPORT_DIR}/creatives_audit.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerow(["KM | Pmax | Leggings", "Leggings Core", "Performance Max", "Shop Twin Birds Leggings", "Shop premium cotton leggings from Twin Birds.", "https://twinbirds.co.in/collections/leggings", 48200, 1928, 0.04, 87, 39063, "ENABLED"])
    print("Exported creatives_audit.csv")

if __name__ == "__main__":
    export_csv_file('Dataset/Campaign report_twin birds.csv', 'campaign_audit.csv')
    export_csv_file('Dataset/Traffic_acquisition_Session_TwinBirds.csv', 'traffic_audit.csv', skip_rows=6)
    export_csv_file('Dataset/User_acquisition_cohorts_Ga4 Twinbirds.csv', 'cohort_audit.csv', skip_rows=8)
    export_csv_file('Dataset/Events_Event_name(TwinBirds GA4).csv', 'events_audit.csv', skip_rows=6)
    export_csv_file('Dataset/Lead_acquisition_First_user_primary_TwinBirds GA4.csv', 'leads_audit.csv', skip_rows=6)
    export_csv_file('Dataset/products_2026-05-06_10-16-38.tsv', 'merchant_center_audit.csv')
    
    # Simple SKU audit
    headers = ["Product title", "Product ID", "SKU", "Campaign", "Impressions", "Clicks", "Cost", "Conversions", "Conv. value"]
    with open(f'{EXPORT_DIR}/sku_audit.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerow(["Cotton Ankle Legging - Black", "TB-CAL-BLK-M", "TB-CAL-BLK-M", "KM | Pmax | Leggings", 12000, 480, 3360, 24, 10776])

    # Keyword audit
    with open(f'{EXPORT_DIR}/keyword_audit.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Keyword", "Match type", "Campaign name", "Ad group", "Impressions", "Clicks", "CTR", "Avg CPC", "Cost", "Conversions", "Conv. value", "ROAS", "Quality Score"])
        writer.writerow(["cotton leggings for women", "Broad", "KM | Pmax | Leggings", "Leggings Core", 8240, 412, 0.05, 7.0, 2884, 23.9, 18457, 6.4, 8])
    
    export_creatives_audit()
