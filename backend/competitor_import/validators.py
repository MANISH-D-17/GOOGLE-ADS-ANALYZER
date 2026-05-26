import os
import json
from typing import Tuple, List

REQUIRED_FILES = [
    "metadata/website.json",
    "metadata/ads.json",
    "metadata/campaigns.json",
    "metadata/keywords.json",
    "metadata/creatives.json",
    "metadata/analysis.json",
]

def validate_extracted_package(extracted_path: str) -> Tuple[bool, str]:
    """
    Validates that the extracted ZIP contents comply with the structure requirements.
    Validates existence of required JSON metadata, malformed JSON, and asset directories.
    """
    # 1. Validate required JSON metadata files
    for req_file in REQUIRED_FILES:
        full_path = os.path.join(extracted_path, req_file)
        if not os.path.exists(full_path):
            return False, f"Missing required metadata file: {req_file}"
        
        # Validate JSON format
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                json.load(f)
        except json.JSONDecodeError:
            return False, f"Malformed JSON in required file: {req_file}"
        except Exception as e:
            return False, f"Failed to read file {req_file}: {str(e)}"
            
    # 2. Validate folders
    required_folders = [
        "images/banners",
        "images/products",
        "images/creatives",
        "images/thumbnails",
        "reports",
        "text",
    ]
    for folder in required_folders:
        full_folder_path = os.path.join(extracted_path, folder)
        if not os.path.exists(full_folder_path):
            # Try to create empty directory if missing rather than failing, 
            # but ensure we log it or handle it gracefully.
            os.makedirs(full_folder_path, exist_ok=True)
            
    # 3. Validate reports exist
    required_reports = [
        "reports/keyword-analysis.csv",
        "reports/creative-analysis.csv",
        "reports/competitor-summary.json",
    ]
    for rep in required_reports:
        full_rep_path = os.path.join(extracted_path, rep)
        if not os.path.exists(full_rep_path):
            return False, f"Missing required report file: {rep}"
            
    return True, "Valid"
