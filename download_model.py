"""Download trained model from Modal volume."""

import modal
import os
from pathlib import Path

volume = modal.Volume.from_name("braille-models")

app = modal.App("braille-download")

@app.function(volumes={"/data": volume})
def list_files():
    """List files in the Modal volume."""
    import os
    files = []
    for root, dirs, filenames in os.walk("/data"):
        for f in filenames:
            path = os.path.join(root, f)
            size = os.path.getsize(path)
            files.append((path, size))
    return files

@app.function(volumes={"/data": volume})
def get_file(path: str) -> bytes:
    """Get a single file from the volume."""
    with open(path, "rb") as f:
        return f.read()

@app.local_entrypoint()
def main():
    print("Listing files on Modal volume...")
    files = list_files.remote()
    
    print(f"\nFound {len(files)} files:")
    for path, size in files:
        print(f"  {path} ({size / 1024 / 1024:.2f} MB)")
    
    # Download model files
    output_dir = Path("braille-trained-instruct")
    output_dir.mkdir(exist_ok=True)
    
    model_files = [f for f in files if "/output/" in f[0]]
    print(f"\nDownloading {len(model_files)} model files to {output_dir}/...")
    
    for path, size in model_files:
        filename = os.path.basename(path)
        print(f"  Downloading {filename}...")
        content = get_file.remote(path)
        (output_dir / filename).write_bytes(content)
    
    print(f"\nModel downloaded to {output_dir}/")
