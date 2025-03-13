#!/usr/bin/env python3
"""
Fetch Legal Documents Script

This script fetches legal documents from the CourtListener API and saves them
to the appropriate directories for use with the Legal Query System.
"""

import os
import json
import requests
import argparse
from datetime import datetime

# Base URL for CourtListener API
BASE_URL = "https://www.courtlistener.com/api/rest/v4"

# Directories
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "legal")
CASE_DIR = os.path.join(DATA_DIR, "cases")
STATUTE_DIR = os.path.join(DATA_DIR, "statutes")

# Ensure directories exist
os.makedirs(CASE_DIR, exist_ok=True)
os.makedirs(STATUTE_DIR, exist_ok=True)

def fetch_supreme_court_cases(count=10, query=None):
    """
    Fetch Supreme Court cases from CourtListener API
    
    Args:
        count (int): Number of cases to fetch
        query (str): Optional search query
    
    Returns:
        list: List of case data
    """
    print(f"Fetching {count} Supreme Court cases...")
    
    # Build query parameters
    params = {
        "court": "scotus",  # Supreme Court of the United States
        "order_by": "dateFiled desc",
        "page_size": count
    }
    
    if query:
        params["q"] = query
    
    # Make API request
    response = requests.get(f"{BASE_URL}/search/", params=params)
    
    if response.status_code != 200:
        print(f"Error fetching cases: {response.status_code}")
        print(response.text)
        return []
    
    data = response.json()
    return data.get("results", [])

def fetch_case_by_id(case_id):
    """
    Fetch a specific case by its ID
    
    Args:
        case_id (str): Case ID
    
    Returns:
        dict: Case data
    """
    print(f"Fetching case with ID {case_id}...")
    
    # Make API request
    response = requests.get(f"{BASE_URL}/clusters/{case_id}/")
    
    if response.status_code != 200:
        print(f"Error fetching case: {response.status_code}")
        print(response.text)
        return None
    
    return response.json()

def fetch_opinion_by_id(opinion_id):
    """
    Fetch a specific opinion by its ID
    
    Args:
        opinion_id (str): Opinion ID
    
    Returns:
        dict: Opinion data
    """
    print(f"Fetching opinion with ID {opinion_id}...")
    
    # Make API request
    response = requests.get(f"{BASE_URL}/opinions/{opinion_id}/")
    
    if response.status_code != 200:
        print(f"Error fetching opinion: {response.status_code}")
        print(response.text)
        return None
    
    return response.json()

def extract_concepts_from_text(text, concept_hierarchy_path):
    """
    Extract legal concepts from text using keyword matching
    
    Args:
        text (str): Text to extract concepts from
        concept_hierarchy_path (str): Path to concept hierarchy JSON file
    
    Returns:
        list: Extracted concepts
    """
    concepts = []
    
    try:
        with open(concept_hierarchy_path, 'r') as f:
            hierarchy = json.load(f)
            
        # Get all concept names from hierarchy
        concept_names = list(hierarchy.get("concepts", {}).keys())
        
        # Check each concept
        for concept in concept_names:
            if concept.lower() in text.lower():
                concepts.append(concept)
    except Exception as e:
        print(f"Error extracting concepts: {e}")
    
    return concepts

def save_case(case_data, opinion_data=None):
    """
    Save case data to file
    
    Args:
        case_data (dict): Case data
        opinion_data (dict): Optional opinion data
    
    Returns:
        str: Path to saved file
    """
    # Generate a safe filename
    case_name = case_data.get("case_name", "unknown_case")
    safe_name = case_name.replace(" ", "_").replace(".", "").replace(",", "").lower()
    
    # Extract citation if available
    citation = None
    if case_data.get("citations") and len(case_data["citations"]) > 0:
        citation = case_data["citations"][0].get("cite", "")
    
    # Create metadata
    metadata = {
        "title": case_data.get("case_name", "Unknown Case"),
        "court": case_data.get("court", {}).get("full_name", "Unknown Court"),
        "date": case_data.get("date_filed", "Unknown Date"),
        "jurisdiction": "United States",
        "concepts": extract_concepts_from_text(
            opinion_data.get("plain_text", "") if opinion_data else "", 
            os.path.join(DATA_DIR, "legal-concept-hierarchy.json")
        ),
        "citations": []
    }
    
    # Add citation to filename if available
    if citation:
        safe_name = f"{safe_name}_{citation.replace(' ', '_')}"
    
    # Ensure filename is not too long
    if len(safe_name) > 100:
        safe_name = safe_name[:100]
    
    # Add unique identifier to prevent overwriting
    file_path = os.path.join(CASE_DIR, f"{safe_name}.json")
    
    # Prepare text content
    text_content = ""
    if opinion_data:
        text_content = opinion_data.get("plain_text", "")
        if not text_content and opinion_data.get("html"):
            # Simple HTML to text conversion
            from html.parser import HTMLParser
            
            class MLStripper(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.reset()
                    self.strict = False
                    self.convert_charrefs = True
                    self.text = []
                
                def handle_data(self, d):
                    self.text.append(d)
                
                def get_data(self):
                    return ''.join(self.text)
            
            stripper = MLStripper()
            stripper.feed(opinion_data["html"])
            text_content = stripper.get_data()
    
    # Create final data structure
    data = {
        "metadata": metadata,
        "text": text_content
    }
    
    # Save to file
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved case to {file_path}")
    return file_path

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Fetch legal documents from CourtListener API")
    parser.add_argument("--count", type=int, default=10, help="Number of cases to fetch")
    parser.add_argument("--query", type=str, help="Search query")
    args = parser.parse_args()
    
    # Fetch Supreme Court cases
    cases = fetch_supreme_court_cases(args.count, args.query)
    
    # Process each case
    for case in cases:
        # Fetch full case data
        case_id = case.get("id")
        if not case_id:
            continue
        
        full_case = fetch_case_by_id(case_id)
        if not full_case:
            continue
        
        # Fetch opinion if available
        opinion = None
        if full_case.get("sub_opinions") and len(full_case["sub_opinions"]) > 0:
            opinion_id = full_case["sub_opinions"][0].get("id")
            if opinion_id:
                opinion = fetch_opinion_by_id(opinion_id)
        
        # Save case
        save_case(full_case, opinion)
    
    print(f"Fetched and saved {len(cases)} cases")

if __name__ == "__main__":
    main()
