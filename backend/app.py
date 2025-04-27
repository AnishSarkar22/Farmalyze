# updated crop disease detection model using huggingface https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification model
import string
import os
import bcrypt
from flask import Flask, jsonify, redirect, render_template, url_for, request, Markup
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, ValidationError
from flask_wtf import FlaskForm
from flask_bcrypt import Bcrypt
from datetime import datetime
from gemini import get_alternative_crops
import requests
import numpy as np
import pandas as pd
import pickle
import io
import torch
from torchvision import transforms

from supabase import create_client, Client
from postgrest.exceptions import APIError

from utils.model import ResNet9
from utils.fertilizer import fertilizer_dic
from utils.disease import disease_dic
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image

from dotenv import load_dotenv
load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# -------------------------LOADING THE TRAINED MODELS -----------------------------------------------

# Loading crop recommendation model
crop_recommendation_model_path = 'models/RandomForest.pkl'
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
    



# def weather_fetch(city_name):
#     """
#     Fetch weather data including forecast
#     :params: city_name
#     :return: temperature, humidity (for crop prediction)
#              or full weather data (for dashboard)
#     """
#     weather_api_key=os.getenv("WEATHER_API_KEY")
#     current_url = "http://api.openweathermap.org/data/2.5/weather?"
#     forecast_url = "http://api.openweathermap.org/data/2.5/forecast?"

#     # Get current weather
#     current_complete_url = current_url + "appid=" + weather_api_key + "&q=" + city_name
#     current_response = requests.get(current_complete_url)
#     current_data = current_response.json()

#     if current_data["cod"] != "404":
#         current_weather = current_data["main"]
#         temperature = round((current_weather["temp"] - 273.15), 2)
#         humidity = current_weather["humidity"]

#         # If called from dashboard route, return full weather data
#         if request.endpoint == 'dashboard':
#             weather_description = current_data["weather"][0]["description"]
            
#             # Get rainfall data
#             rainfall = 0
#             if "rain" in current_data:
#                 rainfall = current_data["rain"].get("1h", 0)
            
#             # Get forecast data
#             forecast_response = requests.get(forecast_url + "appid=" + weather_api_key + "&q=" + city_name)
#             forecast_data = forecast_response.json()
            
#             forecast = []
#             for item in forecast_data["list"][:5]:
#                 forecast.append({
#                     "datetime": item["dt_txt"],
#                     "temp": round((item["main"]["temp"] - 273.15), 2),
#                     "humidity": item["main"]["humidity"],
#                     "description": item["weather"][0]["description"],
#                     "rainfall": item["rain"]["3h"] if "rain" in item else 0
#                 })
            
#             return {
#                 "current": {
#                     "temperature": temperature,
#                     "humidity": humidity,
#                     "rainfall": rainfall,
#                     "description": weather_description
#                 },
#                 "forecast": forecast
#             }
        
#         # If called from crop prediction, return just temperature and humidity
#         return temperature, humidity
    
#     return None

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
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "database.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = '3e9u8wyfgbhjvsiuy78tqwdegufcbhsj'
app.config['JSON_SORT_KEYS'] = False
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['CORS_SUPPORTS_CREDENTIALS'] = True

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"



@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model,UserMixin):
    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password = db.Column(db.String(80), nullable=False)

class UserAdmin(db.Model,UserMixin):
    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password = db.Column(db.String(80), nullable=False)

class RegisterForm(FlaskForm):
    username=StringField(validators=[InputRequired(),Length(min=5,max=20)],render_kw={"placeholder":"username"})
    password=PasswordField(validators=[InputRequired(),Length(min=5,max=20)],render_kw={"placeholder":"password"})
    submit = SubmitField("Register")

    def validate_username(self, username):
        existing_user_username = User.query.filter_by(username=username.data).first()
        if existing_user_username:
            raise ValidationError("That username already exist. please choose different one.")

class LoginForm(FlaskForm):
    username=StringField(validators=[InputRequired(),Length(min=5,max=20)],render_kw={"placeholder":"username"})
    password=PasswordField(validators=[InputRequired(),Length(min=5,max=20)],render_kw={"placeholder":"password"})
    submit = SubmitField("Login")


class ContactUs(db.Model):
    sno = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(500), nullable=False)
    text = db.Column(db.String(900), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"{self.sno} - {self.title}"

# ===============================================================================================

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

# @app.route("/aboutus")
# def aboutus():
#     return render_template("aboutus.html")

# @app.route("/contact", methods=['GET', 'POST'])
# def contact():
#     if request.method=='POST':
#         name = request.form['name']
#         email = request.form['email']
#         text = request.form['text']
#         contacts = ContactUs(name=name, email=email, text=text)
#         db.session.add(contacts)
#         db.session.commit()
    
#     return render_template("contact.html")


# test supabase connection
@app.route("/api/test-connection")
def test_connection():
    try:        
        return jsonify({
            'status': 'success',
            'message': 'Successfully connected to Supabase',
            'timestamp': datetime.now().isoformat(),
            'connection': 'online'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to connect to Supabase',
            'error': str(e),
            'connection': 'offline'
        }), 500

# ===============================================================================================
# AUTH ROUTES

# Route for Signup endpoint
@app.route("/api/signup", methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400

        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": name
                }
            }
        })

        if auth_response.user:
            return jsonify({
                'success': True,
                'message': 'User created successfully',
                'user': {
                    'id': auth_response.user.id,
                    'email': email,
                    'name': name
                }
            }), 201

        return jsonify({
            'success': False,
            'error': 'Failed to create user'
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# Route for Signin endpoint
@app.route("/api/login", methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400

        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if auth_response.user:
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email,
                    'access_token': auth_response.session.access_token,
                    'refresh_token': auth_response.session.refresh_token
                }
            })
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 200

        return jsonify({
            'success': False,
            'error': 'Invalid credentials'
        }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

#Route for logout endpoint
@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        response = supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===============================================================================================
# FETCH DATA ROUTES

# Get current user data
@app.route('/api/current-user', methods=['GET', 'OPTIONS'])
def get_current_user():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    try:
        user = supabase.auth.get_user()
        if user and user.user:
            response = jsonify({
                'success': True,
                'user': {
                    'id': user.user.id,
                    'email': user.user.email,
                    'name': user.user.user_metadata.get('full_name', 'User')
                }
            })
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 200
            
        return jsonify({
            'success': False,
            'error': 'No user found'
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
            prediction = crop_recommendation_model.predict(input_data)[0]
            
            # Get soil conditions summary
            soil_conditions = {
                "nitrogen": N,
                "phosphorus": P,
                "potassium": K,
                "ph": ph,
                "rainfall": rainfall,
                "temperature": temperature,
                "humidity": humidity
            }
            
            # Get alternative crops
            alternatives = get_alternative_crops(prediction, soil_conditions, city)
            
            
            return jsonify({
                'success': True,
                'prediction': prediction,
                'alternatives': alternatives,
                'conditions': {
                    'temperature': temperature,
                    'humidity': humidity,
                    'soil_health': 'Good' if (6.0 <= ph <= 7.5) else 'Fair',
                    'location': city
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Could not fetch weather data'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# render fertilizer recommendation result page
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

# ===============================================================================================
# ADMIN ROUTES

@app.route("/AdminLogin", methods=['GET', 'POST'])
def AdminLogin():

    form = LoginForm()
    if current_user.is_authenticated:
         return redirect(url_for('admindashboard'))

    elif form.validate_on_submit():
        user = UserAdmin.query.filter_by(username=form.username.data).first()
        if user:
            if bcrypt.check_password_hash(user.password,form.password.data):
                login_user(user)
                return redirect(url_for('admindashboard'))

    return render_template("adminlogin.html", form=form)

@app.route("/reg",methods=['GET', 'POST'])
def reg():
    form = RegisterForm()

    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data)
        new_user = UserAdmin(username=form.username.data, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('AdminLogin'))

    return render_template("reg.html", form=form)


if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=8000)
