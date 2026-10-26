# app/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Any

class PredictionResult(BaseModel):
    letter: str
    english: str
    marathi: str
    phonetic: str
    example_mr: str
    confidence: float

class PredictResponse(BaseModel):
    success: bool
    detected: bool
    hands_detected: int
    landmarks_points: Optional[List[List[List[float]]]] = None
    prediction: Optional[PredictionResult] = None
    message: Optional[str] = None

class LandmarksPredictRequest(BaseModel):
    landmarks: List[float] = Field(..., description="126-length array of normalized hand landmarks")

class TextToISLRequest(BaseModel):
    text: str
    mode: Optional[str] = "grammar"

class ISLToken(BaseModel):
    type: str
    token: str
    display: str
    marathi: Optional[str] = ""
    phonetic: Optional[str] = ""
    image_url: Optional[str] = None

class TextToISLResponse(BaseModel):
    original_text: str
    isl_gloss: str
    tokens: List[ISLToken]
