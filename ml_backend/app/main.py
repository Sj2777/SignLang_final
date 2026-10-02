# app/main.py
import json
import base64
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictResponse, LandmarksPredictRequest
from .predictor import predictor

app = FastAPI(
    title="HandSpeak ISL Translation API",
    description="Real-time Indian Sign Language (ISL) alphabet and word recognition with English and Marathi output.",
    version="1.0.0"
)

# Allow frontend requests (Vite running on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "HandSpeak ISL Translation API",
        "model_loaded": predictor.model is not None,
        "classes_count": len(predictor.model.classes_) if predictor.model is not None else 0
    }

@app.get("/labels", tags=["Labels"])
def get_labels():
    """Returns the list of supported ISL letters along with Marathi phonetic mappings."""
    return {
        "count": len(predictor.mapping),
        "labels": predictor.mapping
    }

@app.post("/predict/image", response_model=PredictResponse, tags=["Inference"])
async def predict_from_image(file: UploadFile = File(...)):
    """
    Upload an image (JPEG, PNG, WebP) to translate ISL hand sign to English and Marathi.
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
        
    image_bytes = await file.read()
    result = predictor.predict_image(image_bytes)
    return result

@app.post("/predict/landmarks", response_model=PredictResponse, tags=["Inference"])
def predict_from_landmarks(payload: LandmarksPredictRequest):
    """
    Directly send 126 normalized MediaPipe landmarks for ultra low-latency live camera streaming.
    """
    result = predictor.predict_landmarks(payload.landmarks)
    return result

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time low-latency video streaming.
    Accepts binary image frames (JPEG) and returns JSON predictions.
    """
    await websocket.accept()
    try:
        while True:
            # Receive image frame as bytes
            image_bytes = await websocket.receive_bytes()
            
            # Predict
            result = predictor.predict_image(image_bytes)
            
            # Send result back
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"error": str(e), "success": False})
        except:
            pass
