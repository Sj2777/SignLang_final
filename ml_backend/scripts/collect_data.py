# scripts/collect_data.py
import cv2
import os
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
import argparse

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')

# Pune / Emergency Vocabulary
DEFAULT_WORDS = [
    "Namaskar", "Madat", "Dawakhana", "Police", "Pune", "Pani", "Jevan"
]

def main():
    parser = argparse.ArgumentParser(description="Collect custom ISL gestures via webcam.")
    parser.add_argument("--words", nargs='+', default=DEFAULT_WORDS, help="List of words to collect")
    parser.add_argument("--samples", type=int, default=100, help="Number of frames per word")
    args = parser.parse_args()

    words_to_collect = args.words
    samples_per_word = args.samples
    
    cap = cv2.VideoCapture(0)
    print("Starting webcam collection...")
    print("Press 's' to start recording current word, 'q' to quit.")

    for word in words_to_collect:
        word_dir = os.path.join(DATA_DIR, word)
        os.makedirs(word_dir, exist_ok=True)
        
        # Ready prompt
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)
            cv2.putText(frame, f"Ready for: {word}? Press 's' to start", (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.imshow("HandSpeak Data Collector", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('s'):
                break
            elif key == ord('q'):
                cap.release()
                cv2.destroyAllWindows()
                return
                
        # Capture countdown & recording
        print(f"Collecting {samples_per_word} frames for {word}...")
        count = 0
        while count < samples_per_word:
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)
            
            img_path = os.path.join(word_dir, f"{count}.jpg")
            cv2.imwrite(img_path, frame)
            
            cv2.putText(frame, f"Recording {word}: {count+1}/{samples_per_word}", (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            cv2.imshow("HandSpeak Data Collector", frame)
            cv2.waitKey(60) # ~15 fps collection delay
            count += 1

    print("\nCollection finished!")
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()