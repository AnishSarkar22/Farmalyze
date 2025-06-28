# Visualization of crop recommendation csv data

import pandas as pd
import plotly.express as px
import dash
import os
from dash import dcc, html
from dash.dependencies import Input, Output

data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Data', 'Crop_recommendation.csv')

# Load the data
df = pd.read_csv(data_path)

# Get unique crops and columns
crop_labels = sorted(df['label'].unique())
columns = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# Create Dash app
app = dash.Dash(__name__)
app.title = "Crop Recommendation Visualization"

app.layout = html.Div([
    html.H1("Crop Recommendation Data Visualization", style={'textAlign': 'center'}),

    html.Div([
        html.Label("Select Crops:"),
        dcc.Dropdown(
            id='crop-selector',
            options=[{'label': crop, 'value': crop} for crop in crop_labels],
            value=crop_labels,  # All selected by default
            multi=True
        ),
    ], style={'width': '50%', 'margin': '10px auto'}),

    html.Div([
        html.Div([
            html.Label("X-Axis:"),
            dcc.Dropdown(
                id='x-axis',
                options=[{'label': col, 'value': col} for col in columns],
                value='N'
            )
        ], style={'width': '45%', 'display': 'inline-block', 'padding': '0 20px'}),

        html.Div([
            html.Label("Y-Axis:"),
            dcc.Dropdown(
                id='y-axis',
                options=[{'label': col, 'value': col} for col in columns],
                value='P'
            )
        ], style={'width': '45%', 'display': 'inline-block', 'padding': '0 20px'}),
    ], style={'textAlign': 'center'}),

    dcc.Graph(id='scatter-plot'),

    html.Div([
        html.H2("Data Insights"),
        html.Ul([
            html.Li("Rice typically requires high nitrogen levels and rainfall."),
            html.Li("Apples and grapes need high phosphorus and potassium."),
            html.Li("Chickpea thrives in low humidity environments."),
            html.Li("Papaya prefers higher temperatures than most other crops.")
        ])
    ], style={'padding': '20px'})
])

@app.callback(
    Output('scatter-plot', 'figure'),
    Input('crop-selector', 'value'),
    Input('x-axis', 'value'),
    Input('y-axis', 'value')
)
def update_graph(selected_crops, x_axis, y_axis):
    filtered_df = df[df['label'].isin(selected_crops)]
    fig = px.scatter(
        filtered_df, x=x_axis, y=y_axis, color='label',
        hover_data=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'],
        title=f'{y_axis} vs {x_axis} for Selected Crops'
    )
    fig.update_layout(height=600)
    return fig

if __name__ == '__main__':
    app.run(debug=True)
