import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import signs from '../../data/signs.json';
import { buildQuestion } from './quizLogic';
import styles from './SpeedQuiz.module.css';

const GAME_SECONDS = 60;
const FEEDBACK_MS = 700;
const BEST_KEY = 'speedQuizBest';

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // storage unavailable: ignore, the game still works
  }
}

function SpeedQuiz() {
  const [phase, setPhase] = useState('start'); // 'start' | 'playing' | 'result'
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [picked, setPicked] = useState(null); // id of the clicked option
  const [best, setBest] = useState(loadBest);
  const [isNewBest, setIsNewBest] = useState(false);
  const feedbackTimer = useRef(null);

  // Clear any pending timeout when leaving the page
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  // Countdown: ticks once per second while playing
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // End the game when time runs out
  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0) return;
    const beatBest = score > best;
    if (beatBest) {
      setBest(score);
      saveBest(score);
    }
    setIsNewBest(beatBest);
    setPhase('result');
  }, [phase, timeLeft, score, best]);

  function startGame() {
    clearTimeout(feedbackTimer.current);
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setPicked(null);
    setQuestion(buildQuestion(signs));
    setPhase('playing');
  }

  function handleAnswer(option) {
    if (picked) return; // ignore clicks during feedback
    setPicked(option.id);
    if (option.id === question.answer.id) {
      setScore((s) => s + 1);
    }
    feedbackTimer.current = setTimeout(() => {
      setPicked(null);
      setQuestion((q) => buildQuestion(signs, q.answer.id));
    }, FEEDBACK_MS);
  }

  function optionClass(option) {
    if (!picked) return styles.option;
    if (option.id === question.answer.id) return `${styles.option} ${styles.correct}`;
    if (option.id === picked) return `${styles.option} ${styles.wrong}`;
    return styles.option;
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.back}>&larr; Back to home</Link>

        {phase === 'start' && (
          <section className={styles.center}>
            <h1>Speed Quiz</h1>
            <p>
              Identify as many Indian Sign Language letters and numbers as you
              can in {GAME_SECONDS} seconds.
            </p>
            <p>Best score: <strong>{best}</strong></p>
            <button className={styles.primary} onClick={startGame}>Start</button>
          </section>
        )}

        {phase === 'playing' && question && (
          <section>
            <div className={styles.stats}>
              <span className={timeLeft <= 10 ? styles.low : ''}>
                Time: <strong>{timeLeft}s</strong>
              </span>
              <span>Score: <strong>{score}</strong></span>
            </div>

            <img
              className={styles.sign}
              src={question.answer.image}
              alt="Indian Sign Language sign to identify"
            />
            <p className={styles.prompt}>Which one is this?</p>

            <div className={styles.options}>
              {question.options.map((option) => (
                <button
                  key={option.id}
                  className={optionClass(option)}
                  onClick={() => handleAnswer(option)}
                  disabled={picked !== null}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {phase === 'result' && (
          <section className={styles.center}>
            <h1>Time's up!</h1>
            <p className={styles.bigScore}>{score}</p>
            <p>correct answers</p>
            {isNewBest && <p className={styles.newBest}>New best score!</p>}
            <p>Best score: <strong>{best}</strong></p>
            <button className={styles.primary} onClick={startGame}>Play again</button>
          </section>
        )}
        <p className={styles.credit}>
          Sign images: Indian Sign Language Research and Training Centre
          (ISLRTC), Government of India.
        </p>
      </div>
    </main>
  );
}

export default SpeedQuiz;