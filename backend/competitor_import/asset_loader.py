import os

def resolve_local_asset_path(extracted_path: str, rel_path: str) -> str:
    """
    Safely resolves the local absolute path of a media asset in the extracted package.
    Protects against path traversal.
    """
    abs_base = os.path.abspath(extracted_path)
    target_path = os.path.abspath(os.path.join(extracted_path, rel_path))
    
    if not target_path.startswith(abs_base + os.sep) and target_path != abs_base:
        raise ValueError(f"Forbidden path: {rel_path}")
        
    if os.path.exists(target_path):
        return target_path
    return ""
