# scripts/collect_data.py
import cv2
import os
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
LETTERS = [chr(i) for i in range(ord('A'), ord('Z') + 1)]  # A to Z
SAMPLES_PER_LETTER = 50

cap = cv2.VideoCapture(0)

print("Starting webcam collection...")
print("Press 's' to start recording current letter, 'q' to quit.")

for letter in LETTERS:
    letter_dir = os.path.join(DATA_DIR, letter)
    os.makedirs(letter_dir, exist_ok=True)
    
    # Ready prompt
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        cv2.putText(frame, f"Ready for: {letter}? Press 's' to start", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        cv2.imshow("HandSpeak Data Collector", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('s'):
            break
        elif key == ord('q'):
            cap.release()
            cv2.destroyAllWindows()
            exit()
            
    # Capture countdown & recording
    print(f"Collecting {SAMPLES_PER_LETTER} frames for {letter}...")
    count = 0
    while count < SAMPLES_PER_LETTER:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        
        img_path = os.path.join(letter_dir, f"{count}.jpg")
        cv2.imwrite(img_path, frame)
        
        cv2.putText(frame, f"Recording {letter}: {count+1}/{SAMPLES_PER_LETTER}", (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.imshow("HandSpeak Data Collector", frame)
        cv2.waitKey(60) # ~15 fps collection delay
        count += 1

print("\nCollection finished!")
cap.release()
cv2.destroyAllWindows()