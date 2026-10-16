import { predictRandomForest } from './rfClassifier';

const MODEL_URL = '/models/isl_alphabet_model.json';
const HAND_LANDMARKER_URL = '/models/hand_landmarker.task';
const LABELS_URL = '/models/label_mapping.json';
const WASM_BASE_URL = '/mediapipe/wasm/';

let localProviderPromise;

async function fetchAsset(url, label, onProgress) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${label} (${response.status}).`);
  }

  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress?.(`${label} loaded`);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    const status = total
      ? `${label} (${Math.min(100, Math.round((loaded / total) * 100))}%)`
      : `${label} (${Math.round(loaded / 1024)} KB)`;
    onProgress?.(status);
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  onProgress?.(`${label} loaded`);
  return bytes;
}

export function loadLocalSignInference(onProgress) {
  if (!localProviderPromise) {
    localProviderPromise = (async () => {
      onProgress?.('Downloading offline model… loading classifier');
      const modelBytes = await fetchAsset(MODEL_URL, 'Classifier', onProgress);
      const model = JSON.parse(new TextDecoder().decode(modelBytes));
      if (model.format !== 'handspeak-random-forest-v1') {
        throw new Error('The downloaded offline classifier has an unsupported format.');
      }

      const handLandmarkerBytes = await fetchAsset(
        HAND_LANDMARKER_URL,
        'Hand detector',
        onProgress,
      );
      const labelsBytes = await fetchAsset(LABELS_URL, 'Label mappings', onProgress);
      const labels = JSON.parse(new TextDecoder().decode(labelsBytes));

      onProgress?.('Initializing local hand detector…');
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      const detector = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetBuffer: handLandmarkerBytes,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      onProgress?.('Ready for offline use');
      return {
        detector,
        labels,
        predict: (features) => predictRandomForest(model, features),
      };
    })().catch((error) => {
      localProviderPromise = undefined;
      throw error;
    });
  }

  return localProviderPromise;
}
