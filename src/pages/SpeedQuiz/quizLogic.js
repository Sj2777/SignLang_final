// Shuffle an array without changing the original (Fisher-Yates)
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build one question: the correct sign + 3 wrong options, shuffled.
// lastId stops the same sign appearing twice in a row.
export function buildQuestion(pool, lastId = null) {
  const candidates = pool.filter((s) => s.id !== lastId);
  const answer = candidates[Math.floor(Math.random() * candidates.length)];

  // Prefer wrong options from the same category (letters with letters,
  // numbers with numbers) so the quiz is fair.
  const sameCategory = pool.filter(
    (s) => s.category === answer.category && s.id !== answer.id
  );
  const others = pool.filter(
    (s) => s.category !== answer.category
  );
    const wrong = [...shuffle(sameCategory), ...shuffle(others)].slice(0, 3);

  return { answer, options: shuffle([answer, ...wrong]) };
}