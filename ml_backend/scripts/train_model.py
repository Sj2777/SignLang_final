# scripts/train_model.py
import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'isl_alphabet_model.joblib')

def train():
    x_path = os.path.join(PROCESSED_DIR, 'X.npy')
    y_path = os.path.join(PROCESSED_DIR, 'y.npy')
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        print("Error: Extracted features not found! Please run 'python scripts/extract_features.py' first.")
        return

    print("Loading extracted landmarks...")
    X = np.load(x_path)
    y = np.load(y_path)
    print(f"Loaded {X.shape[0]} samples with {X.shape[1]} features across {len(np.unique(y))} classes.")

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Training set: {X_train.shape[0]} samples | Test set: {X_test.shape[0]} samples")

    print("\nTraining Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=20,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n==================================================")
    print(f">> Model Accuracy on Test Set: {acc * 100:.2f}%")
    print(f"==================================================")
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred))

    # Save trained model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\nSaved trained model to: {MODEL_PATH}")

if __name__ == '__main__':
    train()
