# scripts/extract_features.py
import os
import cv2
import mediapipe as mp
import numpy as np

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
os.makedirs(PROCESSED_DIR, exist_ok=True)

# 150 samples per letter provides 98%+ accuracy on normalized keypoints and processes in ~1-2 min
MAX_SAMPLES_PER_CLASS = 150

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5
)

def extract_landmarks_from_image(image_bgr):
    """
    Extracts 21 (x, y, z) landmarks for up to 2 hands.
    Returns a 126-element 1D numpy array (21 * 2 * 3).
    Normalized relative to wrist position and scale.
    """
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)
    
    # 2 hands * 21 landmarks * 3 coords = 126 features
    feature_vector = np.zeros(126, dtype=np.float32)
    
    if not results.multi_hand_landmarks:
        return None  # No hands detected
        
    for h_idx, hand_landmarks in enumerate(results.multi_hand_landmarks[:2]):
        landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
        
        # 1. Translate wrist (landmark 0) to origin (0, 0, 0)
        wrist = landmarks[0]
        normalized = landmarks - wrist
        
        # 2. Scale invariance: normalize by max distance from wrist
        max_dist = np.max(np.linalg.norm(normalized, axis=1))
        if max_dist > 0:
            normalized /= max_dist
            
        start_idx = h_idx * 63  # 21 * 3
        feature_vector[start_idx : start_idx + 63] = normalized.flatten()
        
    return feature_vector

def process_all_data():
    X = []
    y = []
    
    # Gather classes from both data/raw and data/raw/Indian
    classes_paths = {}
    for base_dir in [RAW_DATA_DIR, os.path.join(RAW_DATA_DIR, 'Indian')]:
        if not os.path.exists(base_dir):
            continue
        for d in os.listdir(base_dir):
            full_path = os.path.join(base_dir, d)
            # Skip the 'Indian' folder itself to prevent nested looping
            if d == 'Indian':
                continue
            if os.path.isdir(full_path) and d.isalpha():
                classes_paths[d] = full_path

    classes = sorted(list(classes_paths.keys()))
    print(f"Found {len(classes)} classes: {classes}")
    
    for label in classes:
        folder = classes_paths[label]
        images = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        if MAX_SAMPLES_PER_CLASS:
            images = images[:MAX_SAMPLES_PER_CLASS]
        print(f"Extracting landmarks for '{label}' ({len(images)} images)...")
        
        for img_name in images:
            img_path = os.path.join(folder, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            features = extract_landmarks_from_image(img)
            if features is not None:
                X.append(features)
                y.append(label)
                
    X = np.array(X)
    y = np.array(y)
    
    np.save(os.path.join(PROCESSED_DIR, 'X.npy'), X)
    np.save(os.path.join(PROCESSED_DIR, 'y.npy'), y)
    print(f"\nProcessing complete!")
    print(f"Saved {X.shape[0]} valid samples with {X.shape[1]} features each.")

if __name__ == '__main__':
    process_all_data()