import cv2
import os
import numpy as np
import mediapipe as mp
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw_sequences')
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed_seq')

WORDS = ["Namaskar", "Madat", "Dawakhana", "Police", "Pune", "Pani", "Jevan"]
SEQUENCE_LENGTH = 30
SAMPLES_PER_WORD = 30 # Number of videos per word

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)

def extract_landmarks(results):
    feature_vector = np.zeros(126, dtype=np.float32)
    if not results.multi_hand_landmarks:
        return feature_vector

    hand_landmarks_list = sorted(results.multi_hand_landmarks[:2], key=lambda hl: hl.landmark[0].x)
    for h_idx, hand_landmarks in enumerate(hand_landmarks_list):
        landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
        wrist = landmarks[0]
        normalized = landmarks - wrist
        max_dist = np.max(np.linalg.norm(normalized, axis=1))
        if max_dist > 0:
            normalized /= max_dist
        start_idx = h_idx * 63
        feature_vector[start_idx : start_idx + 63] = normalized.flatten()
    return feature_vector

def main():
    print("=== Dynamic Word Sequence Collector ===")
    cap = cv2.VideoCapture(0)
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    X, y = [], []

    for word in WORDS:
        print(f"\nReady to collect {SAMPLES_PER_WORD} video sequences for: {word}")
        input("Press ENTER when ready...")
        
        for sample in range(SAMPLES_PER_WORD):
            # Countdown
            for i in range(3, 0, -1):
                ret, frame = cap.read()
                frame = cv2.flip(frame, 1)
                cv2.putText(frame, f"Starting {word} ({sample+1}/{SAMPLES_PER_WORD}) in {i}...", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                cv2.imshow('Dynamic Collector', frame)
                cv2.waitKey(1000)

            sequence = []
            for frame_num in range(SEQUENCE_LENGTH):
                ret, frame = cap.read()
                frame = cv2.flip(frame, 1)
                
                # Extract features live
                image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(image_rgb)
                features = extract_landmarks(results)
                sequence.append(features)

                # Draw skeleton for feedback
                if results.multi_hand_landmarks:
                    for hl in results.multi_hand_landmarks:
                        mp.solutions.drawing_utils.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS)
                
                cv2.putText(frame, f"Recording {word} - Video {sample+1}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.imshow('Dynamic Collector', frame)
                cv2.waitKey(50) # Approx 20 FPS

            X.append(sequence)
            y.append(word)

    cap.release()
    cv2.destroyAllWindows()

    print("\nSaving sequences...")
    X = np.array(X)
    y = np.array(y)
    
    np.save(os.path.join(PROCESSED_DIR, 'X.npy'), X)
    np.save(os.path.join(PROCESSED_DIR, 'y.npy'), y)
    np.save(os.path.join(PROCESSED_DIR, 'classes.npy'), np.array(WORDS))
    print(f"Saved {X.shape[0]} sequences of shape {X.shape[1:]} successfully!")

if __name__ == '__main__':
    main()
