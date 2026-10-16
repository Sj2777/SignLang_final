export function predictRandomForest(model, features) {
  if (model.format !== 'handspeak-random-forest-v1' || features.length !== model.nFeatures) {
    throw new Error('The local sign classifier received an incompatible model or feature vector.');
  }

  const probabilities = new Float64Array(model.classes.length);
  for (const tree of model.trees) {
    let node = 0;
    while (tree.left[node] >= 0) {
      node = features[tree.feature[node]] <= tree.threshold[node]
        ? tree.left[node]
        : tree.right[node];
    }

    for (let index = tree.leafOffsets[node]; index < tree.leafOffsets[node + 1]; index += 1) {
      probabilities[tree.leafClasses[index]] += tree.leafValues[index];
    }
  }

  let bestClass = 0;
  for (let index = 1; index < probabilities.length; index += 1) {
    if (probabilities[index] > probabilities[bestClass]) {
      bestClass = index;
    }
  }

  const confidence = probabilities[bestClass] / model.trees.length;
  return {
    letter: model.classes[bestClass],
    confidence: Number(confidence.toFixed(4)),
  };
}
