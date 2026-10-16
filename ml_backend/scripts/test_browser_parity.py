"""Compare Python and browser feature extraction and forest predictions."""

import json
import math
import os
import subprocess
from pathlib import Path

import numpy as np

from export_model import ROOT, load_forest


MODEL_JSON = ROOT / "public" / "models" / "isl_alphabet_model.json"
NODE_CHECK = r"""
import { readFile } from 'node:fs/promises';
import { extractFeatures } from './src/lib/signFeatures.js';
import { predictRandomForest } from './src/lib/rfClassifier.js';

const model = JSON.parse(await readFile(process.env.HANDSPEAK_MODEL_JSON, 'utf8'));
const fixtures = JSON.parse(await new Promise((resolve, reject) => {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => resolve(input));
  process.stdin.on('error', reject);
}));
const results = fixtures.map(hands => {
  const { features, numHands } = extractFeatures(hands);
  return {
    features: Array.from(features),
    numHands,
    prediction: predictRandomForest(model, features)
  };
});
process.stdout.write(JSON.stringify(results));
"""


def make_hand(seed, wrist_x):
    landmarks = []
    for index in range(21):
        angle = (index + seed * 2) * 0.37
        landmarks.append({
            "x": wrist_x + 0.13 * math.sin(angle) + (index % 4) * 0.006,
            "y": 0.46 + 0.18 * math.cos(angle * 0.83),
            "z": 0.025 * math.sin(angle * 1.17),
        })
    return landmarks


def make_fixtures():
    left = make_hand(1, 0.28)
    right = make_hand(4, 0.71)
    return [
        [left],
        [left, right],
        [right, left],
        [make_hand(8, 0.52)],
    ]


def extract_python_features(hands):
    feature_vector = np.zeros(126, dtype=np.float32)
    ordered_hands = sorted(hands[:2], key=lambda hand: hand[0]["x"])

    for hand_index, hand in enumerate(ordered_hands):
        landmarks = np.array(
            [[point["x"], point["y"], point["z"]] for point in hand],
            dtype=np.float64,
        )
        normalized = landmarks - landmarks[0]
        max_distance = np.max(np.linalg.norm(normalized, axis=1))
        if max_distance > 0:
            normalized /= max_distance
        start = hand_index * 63
        feature_vector[start:start + 63] = normalized.flatten()

    return feature_vector, len(ordered_hands)


def predict_python(model, features):
    probabilities = np.zeros(len(model.classes_), dtype=np.float64)
    for estimator in model.estimators_:
        tree = estimator.tree_
        nodes = tree.nodes
        node_index = 0
        while nodes["left_child"][node_index] >= 0:
            feature_index = nodes["feature"][node_index]
            if features[feature_index] <= nodes["threshold"][node_index]:
                node_index = nodes["left_child"][node_index]
            else:
                node_index = nodes["right_child"][node_index]
        probabilities += tree.values[node_index, 0, :]

    probabilities /= len(model.estimators_)
    class_index = int(np.argmax(probabilities))
    return str(model.classes_[class_index]), float(probabilities[class_index])


def main():
    if not MODEL_JSON.is_file():
        raise FileNotFoundError("Run ml_backend/scripts/export_model.py before the parity test.")

    fixtures = make_fixtures()
    model = load_forest()
    environment = os.environ.copy()
    environment["HANDSPEAK_MODEL_JSON"] = str(MODEL_JSON)
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", NODE_CHECK],
        cwd=ROOT,
        env=environment,
        input=json.dumps(fixtures),
        text=True,
        capture_output=True,
        check=True,
    )
    js_results = json.loads(completed.stdout)
    if len(js_results) != len(fixtures):
        raise AssertionError("The JavaScript parity runner returned an unexpected result count.")

    for index, (hands, js_result) in enumerate(zip(fixtures, js_results)):
        python_features, python_hand_count = extract_python_features(hands)
        js_features = np.asarray(js_result["features"], dtype=np.float32)
        if js_result["numHands"] != python_hand_count:
            raise AssertionError(f"Fixture {index}: hand count differs.")
        if not np.allclose(python_features, js_features, rtol=0, atol=1e-7):
            raise AssertionError(f"Fixture {index}: normalized feature vectors differ.")

        python_label, python_confidence = predict_python(model, python_features)
        if js_result["prediction"]["letter"] != python_label:
            raise AssertionError(
                f"Fixture {index}: Python predicted {python_label}, "
                f"JavaScript predicted {js_result['prediction']['letter']}."
            )
        if round(python_confidence, 4) != js_result["prediction"]["confidence"]:
            raise AssertionError(
                f"Fixture {index}: rounded confidence differs "
                f"({round(python_confidence, 4)} vs "
                f"{js_result['prediction']['confidence']})."
            )

    print(f"Parity passed for {len(fixtures)} fixed landmark fixtures.")
    print("Feature vectors matched within 1e-7; labels matched exactly; rounded confidence matched.")


if __name__ == "__main__":
    main()
