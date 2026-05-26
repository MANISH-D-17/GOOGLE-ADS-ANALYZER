import os
import json
import csv

def read_json_metadata(extracted_path: str, filepath: str) -> dict:
    """Reads a JSON file safely from the extracted ZIP path."""
    full_path = os.path.join(extracted_path, filepath)
    if not os.path.exists(full_path):
        return {}
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def read_csv_report(extracted_path: str, filepath: str) -> list:
    """Reads a CSV report safely from the extracted ZIP path."""
    full_path = os.path.join(extracted_path, filepath)
    if not os.path.exists(full_path):
        return []
    try:
        rows = []
        with open(full_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(dict(row))
        return rows
    except Exception:
        return []

def read_text_file(extracted_path: str, filepath: str) -> list:
    """Reads a line-separated text file safely."""
    full_path = os.path.join(extracted_path, filepath)
    if not os.path.exists(full_path):
        return []
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip()]
    except Exception:
        return []
