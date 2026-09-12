#!/bin/bash
# Recipe Builder Launcher
# Opens the Recipe Builder web UI in your browser

cd "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables/BLENDER_RECIPE-BUILDER"

# Check if already running
if lsof -Pi :5555 -sTCP:LISTEN -t >/dev/null ; then
    echo "App already running! Opening browser..."
    sleep 0.5
else
    echo "Starting Recipe Builder..."
fi

# Open browser
open http://localhost:5555 2>/dev/null || true

# Start or keep running the app
python3 app.py
