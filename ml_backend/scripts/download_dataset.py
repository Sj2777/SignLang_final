# scripts/download_dataset.py
import kagglehub
import shutil
import os

print("Downloading ISL dataset from Kaggle...")
# Downloads the popular ISL dataset (Prathmesh Pawar / ISL)
path = kagglehub.dataset_download("prathmesh20/indian-sign-language-dataset")

print(f"Downloaded to: {path}")

# Destination: ml_backend/data/raw
dest_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
os.makedirs(dest_dir, exist_ok=True)

print(f"Copying images into: {dest_dir} ...")
# If the dataset contains subfolders A-Z, copy them
for item in os.listdir(path):
    src_item = os.path.join(path, item)
    dest_item = os.path.join(dest_dir, item)
    if os.path.isdir(src_item):
        if os.path.exists(dest_item):
            shutil.rmtree(dest_item)
        shutil.copytree(src_item, dest_item)

print("Dataset is ready in ml_backend/data/raw!")