# app/predictor.py
import os
import json
import cv2
import joblib
import numpy as np
import mediapipe as mp

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'isl_alphabet_model.joblib')
MAPPING_PATH = os.path.join(BASE_DIR, 'models', 'label_mapping.json')

class SignPredictor:
    def __init__(self):
        self.model = None
        self.mapping = {}
        self.load_model()
        self.load_mapping()
        
        # Initialize MediaPipe Hands for inference
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
            print(f"Loaded ISL model from {MODEL_PATH}")
        else:
            print(f"Warning: Model not found at {MODEL_PATH}. Inference will fail until model is trained.")

    def load_mapping(self):
        if os.path.exists(MAPPING_PATH):
            with open(MAPPING_PATH, 'r', encoding='utf-8') as f:
                self.mapping = json.load(f)
            print(f"Loaded {len(self.mapping)} label mappings.")
        else:
            print(f"Warning: Label mapping not found at {MAPPING_PATH}")

    def extract_features(self, image_bgr):
        """Extracts 126 normalized landmarks (up to 2 hands) from BGR image."""
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        if not results.multi_hand_landmarks:
            return None, 0, []

        feature_vector = np.zeros(126, dtype=np.float32)
        num_hands = len(results.multi_hand_landmarks[:2])
        raw_points = []

        for h_idx, hand_landmarks in enumerate(results.multi_hand_landmarks[:2]):
            landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
            raw_points.append(landmarks.tolist())
            
            wrist = landmarks[0]
            normalized = landmarks - wrist
            
            max_dist = np.max(np.linalg.norm(normalized, axis=1))
            if max_dist > 0:
                normalized /= max_dist
                
            start_idx = h_idx * 63
            feature_vector[start_idx : start_idx + 63] = normalized.flatten()
            
        return feature_vector, num_hands, raw_points

    def predict_image(self, image_bytes: bytes):
        if self.model is None:
            return {
                "success": False,
                "detected": False,
                "hands_detected": 0,
                "message": "Model not trained or loaded yet."
            }

        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return {
                "success": False,
                "detected": False,
                "hands_detected": 0,
                "message": "Invalid image payload."
            }

        features, num_hands, raw_points = self.extract_features(image)
        if features is None:
            return {
                "success": True,
                "detected": False,
                "hands_detected": 0,
                "message": "No hands detected in image."
            }

        return self._predict_from_vector(features, num_hands, raw_points)

    def predict_landmarks(self, landmarks_list):
        if self.model is None:
            return {
                "success": False,
                "detected": False,
                "hands_detected": 0,
                "message": "Model not trained or loaded yet."
            }

        features = np.array(landmarks_list, dtype=np.float32)
        if len(features) != 126:
            return {
                "success": False,
                "detected": False,
                "hands_detected": 0,
                "message": f"Expected 126 features, got {len(features)}"
            }

        num_hands = 2 if np.any(features[63:]) else 1
        return self._predict_from_vector(features, num_hands, [])

    def _predict_from_vector(self, features, num_hands, raw_points):
        probs = self.model.predict_proba([features])[0]
        max_idx = np.argmax(probs)
        letter = self.model.classes_[max_idx]
        confidence = float(probs[max_idx])

        # Get Marathi mapping
        meta = self.mapping.get(letter, {
            "english": letter,
            "marathi": letter,
            "phonetic": letter,
            "example_mr": ""
        })

        return {
            "success": True,
            "detected": True,
            "hands_detected": num_hands,
            "landmarks_points": raw_points,
            "prediction": {
                "letter": letter,
                "english": meta.get("english", letter),
                "marathi": meta.get("marathi", letter),
                "phonetic": meta.get("phonetic", letter),
                "example_mr": meta.get("example_mr", ""),
                "confidence": round(confidence, 4)
            }
        }

predictor = SignPredictor()
