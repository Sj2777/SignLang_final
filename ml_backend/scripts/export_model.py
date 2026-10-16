"""Export the trained RandomForest into a compact, browser-friendly JSON format."""

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from joblib.numpy_pickle import NumpyUnpickler


ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "ml_backend" / "models" / "isl_alphabet_model.joblib"
MAPPING_PATH = ROOT / "ml_backend" / "models" / "label_mapping.json"


class _PicklePlaceholder:
    def __new__(cls, *args, **kwargs):
        return super().__new__(cls)

    def __setstate__(self, state):
        if isinstance(state, dict):
            self.__dict__.update(state)
        else:
            self.__dict__["_pickle_state"] = state


class _ModelUnpickler(NumpyUnpickler):
    def find_class(self, module, name):
        if module.startswith("sklearn."):
            return _PicklePlaceholder
        return super().find_class(module, name)


def load_forest(model_path=MODEL_PATH):
    """Read estimator arrays without importing sklearn's compiled extensions."""
    with Path(model_path).open("rb") as model_file:
        model = _ModelUnpickler(str(model_path), model_file, True).load()

    if len(model.estimators_) != 150 or int(model.n_features_in_) != 126:
        raise ValueError("Expected the 150-tree, 126-feature ISL RandomForest model.")
    return model


def export_forest(model, output_path):
    classes = [str(label) for label in model.classes_.tolist()]
    trees = []

    for estimator in model.estimators_:
        tree = estimator.tree_
        nodes = tree.nodes
        left = nodes["left_child"]
        right = nodes["right_child"]
        leaf_offsets = [0]
        leaf_classes = []
        leaf_values = []

        for node_index in range(len(nodes)):
            if left[node_index] < 0:
                values = tree.values[node_index, 0, :]
                class_indexes = np.flatnonzero(values)
                leaf_classes.extend(int(index) for index in class_indexes)
                leaf_values.extend(float(values[index]) for index in class_indexes)
            leaf_offsets.append(len(leaf_classes))

        trees.append({
            "left": [int(value) for value in left],
            "right": [int(value) for value in right],
            "feature": [int(value) for value in nodes["feature"]],
            "threshold": [float(value) for value in nodes["threshold"]],
            "leafOffsets": leaf_offsets,
            "leafClasses": leaf_classes,
            "leafValues": leaf_values,
        })

    exported = {
        "format": "handspeak-random-forest-v1",
        "estimator": "RandomForestClassifier",
        "nFeatures": int(model.n_features_in_),
        "classes": classes,
        "trees": trees,
    }

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(exported, output_file, separators=(",", ":"), allow_nan=False)
    return output_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ROOT / "public" / "models",
        help="Directory for browser model assets (default: public/models).",
    )
    args = parser.parse_args()

    model = load_forest()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output_path = export_forest(model, args.output_dir / "isl_alphabet_model.json")
    shutil.copyfile(MAPPING_PATH, args.output_dir / "label_mapping.json")
    print(
        f"Exported RandomForestClassifier: 126 features, {len(model.classes_)} classes, "
        f"{len(model.estimators_)} trees -> {output_path}"
    )
    parameter_names = (
        "n_estimators",
        "criterion",
        "max_depth",
        "max_features",
        "min_samples_split",
        "min_samples_leaf",
        "bootstrap",
        "random_state",
        "n_jobs",
        "oob_score",
        "class_weight",
    )
    parameters = {name: model.__dict__.get(name) for name in parameter_names}
    print(f"Parameters: {json.dumps(parameters, sort_keys=True)}")


if __name__ == "__main__":
    main()
