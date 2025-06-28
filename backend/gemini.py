# This file is not part of the main application; it was created for initial machine learning experiments

import google.genai as genai
import os
import json
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize the client with API key
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def extract_json_from_text(text):
    """
    Extract a JSON array from text using regex (assuming it's inside square brackets)
    """
    match = re.search(r'\[\s*{.*?}\s*\]', text, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    else:
        raise ValueError("No JSON list found in model output.")

def get_alternative_crops(main_crop, conditions, city=None):
    """
    Get alternative crop suggestions using Gemini
    """
    location_info = f"- Location: {city}\n" if city else ""
    
    prompt = f"""
    Based on these farming conditions:
    - Main crop recommended: {main_crop}
    {location_info}- Nitrogen: {conditions['nitrogen']} kg/ha
    - Phosphorus: {conditions['phosphorus']} kg/ha
    - Potassium: {conditions['potassium']} kg/ha
    - pH: {conditions['ph']}
    - Rainfall: {conditions['rainfall']} mm
    - Temperature: {conditions['temperature']}°C
    - Humidity: {conditions['humidity']}%

    Considering the local climate and soil conditions in {city if city else 'the area'}, 
    suggest 2 alternative crops that would grow well in these conditions.
    Return only a valid JSON array in this exact format:
    [
        {{"name": "crop name", "confidence": confidence_number, "reason": "one line reason considering local conditions"}},
        {{"name": "crop name", "confidence": confidence_number, "reason": "one line reason considering local conditions"}}
    ]
    Where confidence_number should be between 75-90.
    """

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        
        output_text = response.text.strip()
        alternatives = extract_json_from_text(output_text)
        return alternatives[:2]
    except Exception as e:
        print(f"Error generating alternatives: {e}")
        # return [
        #     {"name": "Rice", "confidence": 85, "reason": f"Suitable for {city if city else 'local'} climate and soil conditions"},
        #     {"name": "Barley", "confidence": 82, "reason": f"Well-adapted to {city if city else 'these'} growing conditions"}
        # ]



# test to check get_alternative_crops model
if __name__ == "__main__":
    # Test the function with a city
    main_crop = "Wheat"
    conditions = {
        "nitrogen": 120,
        "phosphorus": 60,
        "potassium": 40,
        "ph": 6.5,
        "rainfall": 700,
        "temperature": 22,
        "humidity": 70
    }
    test_city = "Mumbai"  # Example city

    print("\nTesting alternative crops generation...")
    print(f"Main crop: {main_crop}")
    print(f"Location: {test_city}")
    print(f"Conditions: {conditions}\n")

    alternatives = get_alternative_crops(main_crop, conditions, test_city)
    print("Alternative Crops:")
    for crop in alternatives:
        print(f"- {crop['name']} ({crop['confidence']}% confidence)")
        print(f"  Reason: {crop['reason']}\n")