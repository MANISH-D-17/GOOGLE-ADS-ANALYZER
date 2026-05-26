from competitor_import.metadata_reader import read_json_metadata, read_csv_report, read_text_file

def parse_competitor_package(extracted_path: str) -> dict:
    """
    Parses all extracted ZIP components into a standard dictionary.
    Includes metadata, text files, and reports.
    """
    website = read_json_metadata(extracted_path, "metadata/website.json")
    ads = read_json_metadata(extracted_path, "metadata/ads.json")
    campaigns = read_json_metadata(extracted_path, "metadata/campaigns.json")
    keywords = read_json_metadata(extracted_path, "metadata/keywords.json")
    creatives = read_json_metadata(extracted_path, "metadata/creatives.json")
    analysis = read_json_metadata(extracted_path, "metadata/analysis.json")
    summary = read_json_metadata(extracted_path, "reports/competitor-summary.json")
    
    # Read text files
    headlines = read_text_file(extracted_path, "text/headlines.txt")
    descriptions = read_text_file(extracted_path, "text/descriptions.txt")
    ctas = read_text_file(extracted_path, "text/CTA.txt")
    offers = read_text_file(extracted_path, "text/offers.txt")
    
    # Read CSV reports
    keyword_analysis = read_csv_report(extracted_path, "reports/keyword-analysis.csv")
    creative_analysis = read_csv_report(extracted_path, "reports/creative-analysis.csv")
    
    return {
        "website": website,
        "ads": ads,
        "campaigns": campaigns,
        "keywords": keywords,
        "creatives": creatives,
        "analysis": analysis,
        "summary": summary,
        "text": {
            "headlines": headlines,
            "descriptions": descriptions,
            "ctas": ctas,
            "offers": offers,
        },
        "reports": {
            "keywordAnalysis": keyword_analysis,
            "creativeAnalysis": creative_analysis,
        }
    }
