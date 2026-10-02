# app/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List

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
    prediction: Optional[PredictionResult] = None
    message: Optional[str] = None

class LandmarksPredictRequest(BaseModel):
    landmarks: List[float] = Field(..., description="126-length array of normalized hand landmarks")
