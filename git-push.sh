#!/bin/bash
# Script to commit and push all changes to git

echo "=== Bible Compression System Git Push ==="
echo "Adding all new and modified files..."
git add .

echo -e "\nCommitting changes..."
git commit -m "Add Bible Compression Comparison feature

- Implement braille-based compression system for religious texts
- Add support for multiple languages
- Create benchmark system for comparing compression methods
- Develop detailed analysis tools for compression performance
- Update documentation with new feature details"

echo -e "\nPushing changes to remote repository..."
git push

echo -e "\nDone! All changes have been pushed to git."
