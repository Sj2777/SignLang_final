import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import TensorBoard
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical

# 30 frames per sequence, 126 landmark features per frame
SEQUENCE_LENGTH = 30
FEATURE_DIM = 126

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed_seq')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'isl_lstm_model.h5')

def train_sequence_model():
    print("=== HandSpeak Dynamic LSTM Trainer ===")
    
    if not os.path.exists(os.path.join(PROCESSED_DIR, 'X.npy')):
        print(f"Error: Could not find sequence data in {PROCESSED_DIR}.")
        print("Please run 'collect_sequences.py' to record dynamic word gestures first.")
        return

    X = np.load(os.path.join(PROCESSED_DIR, 'X.npy'))
    y = np.load(os.path.join(PROCESSED_DIR, 'y.npy'))
    classes = np.load(os.path.join(PROCESSED_DIR, 'classes.npy'))

    print(f"Loaded {X.shape[0]} sequences of length {SEQUENCE_LENGTH}.")
    print(f"Classes ({len(classes)}): {classes}")

    # One-hot encode labels
    label_map = {label: num for num, label in enumerate(classes)}
    y_encoded = np.array([label_map[label] for label in y])
    y_cat = to_categorical(y_encoded).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y_cat, test_size=0.15, random_state=42)

    print("Building LSTM Model...")
    model = Sequential()
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(SEQUENCE_LENGTH, FEATURE_DIM)))
    model.add(LSTM(128, return_sequences=True, activation='relu'))
    model.add(LSTM(64, return_sequences=False, activation='relu'))
    model.add(Dense(64, activation='relu'))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(len(classes), activation='softmax'))

    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

    print("Training Model...")
    model.fit(X_train, y_train, epochs=200, validation_data=(X_test, y_test), batch_size=32)

    print(f"\nSaving model to {MODEL_PATH}")
    model.save(MODEL_PATH)

    # Evaluate
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {accuracy * 100:.2f}%")

if __name__ == '__main__':
    train_sequence_model()
