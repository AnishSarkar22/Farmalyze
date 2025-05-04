# updated crop disease detection model using huggingface https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification model
import os
import json
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
import requests
import numpy as np
import pandas as pd
import pickle
import io
import torch
from datetime import datetime
# from gemini import get_alternative_crops
from torchvision import transforms
# from supabase import create_client, Client
from utils.fertilizer import fertilizer_dic
from utils.disease import disease_dic
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# supabase: Client = create_client(
#     os.getenv("SUPABASE_URL"),
#     os.getenv("SUPABASE_KEY")
# )

# -------------------------LOADING THE TRAINED MODELS -----------------------------------------------

# Loading crop recommendation model
crop_recommendation_model_path = './models/EnhancedRandomForest.pkl'
crop_recommendation_model = pickle.load(
    open(crop_recommendation_model_path, 'rb'))

# Loading plant disease classification model

# disease_classes = ['Apple___Apple_scab',
#                    'Apple___Black_rot',
#                    'Apple___Cedar_apple_rust',
#                    'Apple___healthy',
#                    'Blueberry___healthy',
#                    'Cherry_(including_sour)___Powdery_mildew',
#                    'Cherry_(including_sour)___healthy',
#                    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
#                    'Corn_(maize)___Common_rust_',
#                    'Corn_(maize)___Northern_Leaf_Blight',
#                    'Corn_(maize)___healthy',
#                    'Grape___Black_rot',
#                    'Grape___Esca_(Black_Measles)',
#                    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
#                    'Grape___healthy',
#                    'Orange___Haunglongbing_(Citrus_greening)',
#                    'Peach___Bacterial_spot',
#                    'Peach___healthy',
#                    'Pepper,_bell___Bacterial_spot',
#                    'Pepper,_bell___healthy',
#                    'Potato___Early_blight',
#                    'Potato___Late_blight',
#                    'Potato___healthy',
#                    'Raspberry___healthy',
#                    'Soybean___healthy',
#                    'Squash___Powdery_mildew',
#                    'Strawberry___Leaf_scorch',
#                    'Strawberry___healthy',
#                    'Tomato___Bacterial_spot',
#                    'Tomato___Early_blight',
#                    'Tomato___Late_blight',
#                    'Tomato___Leaf_Mold',
#                    'Tomato___Septoria_leaf_spot',
#                    'Tomato___Spider_mites Two-spotted_spider_mite',
#                    'Tomato___Target_Spot',
#                    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
#                    'Tomato___Tomato_mosaic_virus',
#                    'Tomato___healthy']


# disease prediction
# disease_model_path = 'models/plant_disease_model.pth'
# disease_model = ResNet9(3, len(disease_classes))
# disease_model.load_state_dict(torch.load(
#     disease_model_path, map_location=torch.device('cpu')))
# disease_model.eval()
model_name = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
processor = AutoImageProcessor.from_pretrained(model_name)
disease_model = AutoModelForImageClassification.from_pretrained(model_name)
disease_model.eval()


def weather_fetch(city_name):
    """
    Fetch and returns the temperature and humidity of a city
    :params: city_name
    :return: temperature, humidity
    """
    weather_api_key=os.getenv("WEATHER_API_KEY")
    base_url = "http://api.openweathermap.org/data/2.5/weather?"

    complete_url = base_url + "appid=" + weather_api_key + "&q=" + city_name
    response = requests.get(complete_url)
    x = response.json()

    if x["cod"] != "404":
        y = x["main"]

        temperature = round((y["temp"] - 273.15), 2)
        humidity = y["humidity"]
        return temperature, humidity
    else:
        return None

def predict_image(img, model=disease_model):
    """
    Transforms image to tensor and predicts disease label
    :params: image bytes
    :return: prediction (string)
    """
    # Open image from bytes and convert to RGB
    image = Image.open(io.BytesIO(img)).convert('RGB')
    
    # Preprocess image
    inputs = processor(images=image, return_tensors="pt")
    
    # Get predictions
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
    
    # Get predicted class
    predicted_class_idx = logits.argmax(-1).item()
    prediction = model.config.id2label[predicted_class_idx]
    
    return prediction

app = Flask(__name__)
# CORS(app, supports_credentials=True)
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "allow_credentials": True,
        "expose_headers": ["Set-Cookie"]
    }
})

app.config['JSON_SORT_KEYS'] = False
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['CORS_SUPPORTS_CREDENTIALS'] = True

# ===============================================================================================
# TEST ROUTES

@app.route("/")
def home():
    return jsonify({
        'status': 'success',
        'message': 'Farmalyze API is running',
        'version': '1.0.0'
    })
    
@app.route("/api/health")
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uptime': 'active'
    })
    
@app.route("/api/version")
def get_version():
    import sys
    return jsonify({
        'python_version': sys.version
    })

# test supabase connection
# @app.route("/api/test-connection")
# def test_connection():
#     try:        
#         return jsonify({
#             'status': 'success',
#             'message': 'Successfully connected to Supabase',
#             'timestamp': datetime.now().isoformat(),
#             'connection': 'online'
#         }), 200
        
#     except Exception as e:
#         return jsonify({
#             'status': 'error',
#             'message': 'Failed to connect to Supabase',
#             'error': str(e),
#             'connection': 'offline'
#         }), 500


# ===============================================================================================

# routes to handle session storage
@app.route('/api/auth/session', methods=['GET', 'POST', 'DELETE'])
def handle_session():
    if request.method == 'GET':
        try:
            # Get session from secure cookie
            session = request.cookies.get('sb-auth-token')
            if not session:
                return jsonify({'session': None}), 200
            
            parsed_session = json.loads(session)
            return jsonify({'session': parsed_session}), 200
        except json.JSONDecodeError:
            return jsonify({
                'error': 'Invalid session format',
                'session': None
            }), 400
        
    elif request.method == 'POST':
        # Store session in secure cookie
        data = request.json
        response = make_response(jsonify({'success': True}))
        response.set_cookie(
            'sb-auth-token',
            json.dumps(data['session']),
            httponly=True,
            secure=True,
            samesite='None',
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        return response

    elif request.method == 'DELETE':
        # Clear session cookie
        response = make_response(jsonify({'success': True}))
        response.delete_cookie('sb-auth-token')
        return response


# ===============================================================================================
# FETCH DATA ROUTES

@app.route('/api/weather', methods=['GET'])
def get_weather_data():
    try:
        # Get coordinates from request
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        weather_api_key = os.getenv("WEATHER_API_KEY")
        
        if not all([lat, lon]):
            return jsonify({
                'success': False,
                'error': 'Location coordinates required'
            }), 400
            
        # Use coordinates for weather data
        current_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={weather_api_key}"
        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={weather_api_key}"


        # Get current weather
        current_response = requests.get(current_url)
        current_data = current_response.json()

        if current_data["cod"] != "404":
            # Get forecast data
            forecast_response = requests.get(forecast_url)
            forecast_data = forecast_response.json()

            # Process current weather
            temperature = round((current_data["main"]["temp"] - 273.15), 2)
            humidity = current_data["main"]["humidity"]
            description = current_data["weather"][0]["description"]
            wind_speed = current_data["wind"]["speed"]
            location = f"{current_data['name']}, {current_data['sys']['country']}"
            
            # Get rainfall data
            rainfall = 0
            if "rain" in current_data:
                rainfall = current_data["rain"].get("1h", 0)

            # Process forecast data (next 5 days)
            forecast = []
            for item in forecast_data["list"][:5]:  # Get next 5 time slots
                forecast.append({
                    "datetime": item["dt_txt"],
                    "temp": round((item["main"]["temp"] - 273.15), 2),
                    "humidity": item["main"]["humidity"],
                    "description": item["weather"][0]["description"],
                    "rainfall": item["rain"]["3h"] if "rain" in item else 0
                })

            return jsonify({
                'success': True,
                'data': {
                    'current': {
                        'location': location,
                        'temperature': f"{temperature}°C",
                        'humidity': f"{humidity}%",
                        'rainfall': f"{rainfall}mm",
                        'description': description.title(),
                        'wind_speed': f"{wind_speed}m/s"
                    },
                    'forecast': forecast
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Location not found'
            }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ===============================================================================================
# DISEASE PREDICTION

@app.route('/api/disease-predict', methods=['POST'])
# @login_required
def api_disease_prediction():
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400

        file = request.files['file']
        if not file:
            return jsonify({
                'success': False,
                'error': 'Invalid file'
            }), 400

        img = file.read()
        prediction = predict_image(img)
        cleaned_prediction = prediction.replace("_", " ").title()
        
        disease_info = disease_dic.get(prediction, "")
        
        return jsonify({
            'success': True,
            'prediction': cleaned_prediction,
            'disease_info': disease_info
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# ===============================================================================================
# RENDER PREDICTION PAGES

# render crop recommendation result page
@app.route('/api/crop-predict', methods=['POST'])
# @login_required
def api_crop_prediction():
    try:
        data = request.get_json()
        N = int(data['nitrogen'])
        P = int(data['phosphorus'])
        K = int(data['potassium'])
        ph = float(data['ph'])
        rainfall = float(data['rainfall'])
        city = data['city']

        if weather_fetch(city) is not None:
            temperature, humidity = weather_fetch(city)
            input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
            
            # Get probability predictions for all crops
            crop_probabilities = crop_recommendation_model.predict_proba(input_data)[0]
            
            # Get indices of top 3 predictions
            top_indices = np.argsort(crop_probabilities)[::-1][:3]
            
            # Get the crop names for the top 3 predictions
            top_crops = [crop_recommendation_model.classes_[i] for i in top_indices]
            
            # Get the probabilities for the top 3 predictions (convert to percentage)
            top_probabilities = [round(crop_probabilities[i] * 100, 2) for i in top_indices]
            
            # Primary crop (first recommendation)
            primary_crop = top_crops[0]
            primary_confidence = top_probabilities[0]
            
            # Create list of recommendations with probabilities
            recommendations = [
                {"crop": crop, "confidence": prob} 
                for crop, prob in zip(top_crops, top_probabilities)
            ]
            
            # Create alternative crops list (the 2nd and 3rd recommendations)
            alternatives = [
                {
                    "name": crop, 
                    "confidence": prob,
                    "reason": f"Alternative crop option based on your soil parameters and local weather conditions."
                } 
                for crop, prob in zip(top_crops[1:], top_probabilities[1:])
            ]
            
            # Soil conditions summary
            soil_conditions = {
                "nitrogen": N,
                "phosphorus": P,
                "potassium": K,
                "ph": ph,
                "rainfall": rainfall,
                "temperature": temperature,
                "humidity": humidity
            }
            
            # Return response in the format expected by the frontend
            return jsonify({
                'success': True,
                'prediction': primary_crop,
                'primary_recommendation': primary_crop,
                'recommendations': recommendations,
                'alternatives': alternatives,
                'conditions': {
                    'temperature': temperature,
                    'humidity': humidity,
                    'soil_health': 'Good' if (6.0 <= ph <= 7.5) else 'Fair',
                    'location': city
                },
                'soil_data': soil_conditions
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Could not fetch weather data'
            }), 400

    except Exception as e:
        print(f"Error in crop prediction: {str(e)}")  # Add server-side logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
# render fertilizer suggestion result page
@app.route('/api/fertilizer-predict', methods=['POST'])
# @login_required
def api_fertilizer_prediction():
    try:
        data = request.get_json()
        crop_name = str(data['cropname'])
        N = int(data['nitrogen'])
        P = int(data['phosphorus'])
        K = int(data['potassium'])

        df = pd.read_csv('Data/fertilizer.csv')

        nr = df[df['Crop'] == crop_name]['N'].iloc[0]
        pr = df[df['Crop'] == crop_name]['P'].iloc[0]
        kr = df[df['Crop'] == crop_name]['K'].iloc[0]

        n = nr - N
        p = pr - P
        k = kr - K
        temp = {abs(n): "N", abs(p): "P", abs(k): "K"}
        max_value = temp[max(temp.keys())]

        if max_value == "N":
            key = 'NHigh' if n < 0 else "Nlow"
        elif max_value == "P":
            key = 'PHigh' if p < 0 else "Plow"
        else:
            key = 'KHigh' if k < 0 else "Klow"

        return jsonify({
            'success': True,
            'recommendation': fertilizer_dic[key]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(debug=False, host='0.0.0.0', port=port)
