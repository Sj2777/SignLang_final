# scripts/collect_data.py
import argparse
import cv2
import os
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
LETTERS = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
NUMBERS = [str(i) for i in range(10)]
WORDS = ["Namaskar", "Madat", "Dawakhana", "Police", "Pune", "Pani", "Jevan"]

def main():
    print("=== HandSpeak Data Collector ===")
    print("1. Collect Alphabet (A-Z)")
    print("2. Collect Numbers (0-9)")
    print("3. Collect Pune/Custom Words")
    choice = input("Enter choice (1, 2, or 3): ").strip()

    if choice == '1':
        words_to_collect = LETTERS
    elif choice == '2':
        words_to_collect = NUMBERS
    elif choice == '3':
        words_to_collect = WORDS
    else:
        print("Invalid choice. Exiting.")
        return

    samples_input = input("Enter number of frames to capture per class (default 150): ").strip()
    samples_per_word = int(samples_input) if samples_input.isdigit() else 150

    cap = cv2.VideoCapture(0)
    print("\nStarting webcam collection...")
    print("Press 's' to start recording the current class, 'q' to quit.")

    for word in words_to_collect:
        word_dir = os.path.join(DATA_DIR, word)
        os.makedirs(word_dir, exist_ok=True)
        
        existing = len([f for f in os.listdir(word_dir) if f.endswith('.jpg')])
        if existing >= samples_per_word:
            print(f"Skipping '{word}', already has {existing} samples.")
            continue
            
        while True:
            ret, frame = cap.read()
            if not ret: break
            frame = cv2.flip(frame, 1)
            cv2.putText(frame, f"Ready for: {word}? Press 's' to start", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.imshow("HandSpeak Data Collector", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('s'): break
            elif key == ord('q'):
                cap.release()
                cv2.destroyAllWindows()
                return
                
        print(f"Collecting {samples_per_word} frames for '{word}'...")
        count = existing
        while count < samples_per_word:
            ret, frame = cap.read()
            if not ret: break
            frame = cv2.flip(frame, 1)
            
            img_path = os.path.join(word_dir, f"{count}.jpg")
            cv2.imwrite(img_path, frame)
            
            cv2.putText(frame, f"Recording {word}: {count+1}/{samples_per_word}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            cv2.imshow("HandSpeak Data Collector", frame)
            cv2.waitKey(60)
            count += 1

    print("\nCollection finished!")
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()