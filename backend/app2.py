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
import requests
import numpy as np
import pandas as pd
import config as config
import pickle
import io
import torch
from torchvision import transforms

from utils.model import ResNet9
from utils.fertilizer import fertilizer_dic
from utils.disease import disease_dic
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image

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
    api_key = config.weather_api_key
    base_url = "http://api.openweathermap.org/data/2.5/weather?"

    complete_url = base_url + "appid=" + api_key + "&q=" + city_name
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

@app.route("/login", methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if current_user.is_authenticated:
         return redirect(url_for('dashboard'))

    elif form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            if bcrypt.check_password_hash(user.password,form.password.data):
                login_user(user)
                return redirect(url_for('dashboard'))

    return render_template("login.html", form=form)

# @ app.route('/dashboard',methods=['GET', 'POST'])
# @login_required
# def dashboard():
#     title = 'dashboard'
#     return render_template('dashboard.html',title=title)

@ app.route('/logout',methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route("/signup",methods=['GET', 'POST'])
def signup():
    form = RegisterForm()

    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data)
        new_user = User(username=form.username.data, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))


    return render_template("signup.html", form=form)

# @ app.route('/crop-recommend')
# @login_required
# def crop_recommend():
#     title = 'crop-recommend - Crop Recommendation'
#     return render_template('crop.html', title=title)

# @ app.route('/fertilizer')
# @login_required
# def fertilizer_recommendation():
#     title = '- Fertilizer Suggestion'
#     return render_template('fertilizer.html', title=title)

@app.route('/api/disease-predict', methods=['POST'])
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
            
            return jsonify({
                'success': True,
                'prediction': prediction
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

# @app.route("/display")
# def querydisplay():
#     alltodo = ContactUs.query.all()
#     return render_template("display.html",alltodo=alltodo)

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


# @app.route("/admindashboard")
# @login_required
# def admindashboard():
#     alltodo = ContactUs.query.all()
#     alluser = User.query.all()
#     return render_template("admindashboard.html",alltodo=alltodo, alluser=alluser)

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
