export function extractFeatures(landmarksList) {
  if (!landmarksList?.length) {
    return { features: null, numHands: 0, rawPoints: [] };
  }

  const hands = landmarksList.slice(0, 2).sort((first, second) => first[0].x - second[0].x);
  const features = new Float32Array(126);
  const rawPoints = [];

  hands.forEach((hand, handIndex) => {
    const wrist = hand[0];
    const normalized = hand.map((landmark) => ({
      x: landmark.x - wrist.x,
      y: landmark.y - wrist.y,
      z: landmark.z - wrist.z,
    }));
    const maxDistance = Math.max(
      ...normalized.map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z)),
    );
    const offset = handIndex * 63;

    normalized.forEach(({ x, y, z }, pointIndex) => {
      const scale = maxDistance > 0 ? maxDistance : 1;
      const featureOffset = offset + pointIndex * 3;
      features[featureOffset] = x / scale;
      features[featureOffset + 1] = y / scale;
      features[featureOffset + 2] = z / scale;
    });

    rawPoints.push(hand.map(({ x, y }) => [
      Math.round(x * 10000) / 10000,
      Math.round(y * 10000) / 10000,
    ]));
  });

  return { features, numHands: hands.length, rawPoints };
}
