import os
import zipfile
from typing import Tuple

def safe_extract_zip(zip_path: str, extract_to: str) -> Tuple[bool, str]:
    """
    Safely extracts a ZIP file, preventing path traversal attacks (Zip Slip).
    Checks that all extracted file paths are strictly within the target directory.
    """
    try:
        os.makedirs(extract_to, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for Zip Slip vulnerability
            for member in zip_ref.namelist():
                # Resolve destination path
                dest_path = os.path.abspath(os.path.join(extract_to, member))
                target_dir = os.path.abspath(extract_to)
                
                # Check if dest_path starts with target_dir
                if not dest_path.startswith(target_dir + os.sep) and dest_path != target_dir:
                    return False, f"Malicious path detected in ZIP: {member}"
            
            # If all safe, perform extraction
            zip_ref.extractall(extract_to)
            return True, "Success"
    except Exception as e:
        return False, f"Extraction failed: {str(e)}"
