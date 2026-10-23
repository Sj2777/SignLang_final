import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  loadQuizBestScore,
  recordQuizCompletion,
} from '../../lib/offlineDb';
import signs from '../../data/signs.json';
import { buildQuestion } from './quizLogic';
import styles from './SpeedQuiz.module.css';

const GAME_SECONDS = 60;
const FEEDBACK_MS = 700;

function SpeedQuiz() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('start'); // 'start' | 'playing' | 'result'
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [picked, setPicked] = useState(null); // id of the clicked option
  const [best, setBest] = useState(0);
  const [bestReady, setBestReady] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const feedbackTimer = useRef(null);
  const gameId = useRef(0);
  const recordedGameId = useRef(0);
  const scoreRef = useRef(0);
  const phaseRef = useRef('start');

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Clear any pending timeout when leaving the page
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  // Load best score on mount / user change
  useEffect(() => {
    let active = true;
    setBestReady(false);

    if (!user?.id) {
      setBest(0);
      setBestReady(true);
      return;
    }

    // Try reading local storage first
    try {
      const localVal = Number(localStorage.getItem(`handspeak_quiz_best_${user.id}`)) || 0;
      if (localVal > 0) {
        setBest(localVal);
      }
    } catch {}

    loadQuizBestScore(user.id)
      .then((loadedBest) => {
        if (!active) return;
        setBest((prev) => Math.max(prev, loadedBest));
        setBestReady(true);
      })
      .catch((error) => {
        console.error('Could not load Speed Quiz score.', error);
        if (!active) return;
        setBestReady(true);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const finalizeGame = useCallback((finalScore) => {
    if (gameId.current === recordedGameId.current) return;
    recordedGameId.current = gameId.current;

    const actualScore = Math.max(0, Number(finalScore ?? scoreRef.current) || 0);
    const beatBest = actualScore > best;
    if (beatBest) {
      setBest(actualScore);
      setIsNewBest(true);
    } else {
      setIsNewBest(false);
    }

    try {
      const now = new Date().toISOString();
      const attempt = { score: actualScore, completedAt: now };
      const currentList = JSON.parse(localStorage.getItem('handspeak_quiz_history') || '[]');
      currentList.push(attempt);
      localStorage.setItem('handspeak_quiz_history', JSON.stringify(currentList));
      localStorage.setItem('speedQuizHistory', JSON.stringify(currentList));
      if (user?.id) {
        localStorage.setItem(`handspeak_quiz_history_${user.id}`, JSON.stringify(currentList));
      }
      if (user?.email) {
        const slug = user.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(`handspeak_quiz_history_usr_${slug}`, JSON.stringify(currentList));
      }
      window.dispatchEvent(new CustomEvent('handspeak_quiz_updated', { detail: attempt }));
    } catch {}

    recordQuizCompletion(user || 'guest', actualScore).catch((error) => {
      console.error('Could not save quiz completion.', error);
    });

    setPhase('result');
  }, [best, user]);

  // Save on unexpected unmount if user was actively playing
  useEffect(() => {
    return () => {
      if (
        phaseRef.current === 'playing' &&
        gameId.current !== recordedGameId.current
      ) {
        recordedGameId.current = gameId.current;
        recordQuizCompletion(user || 'guest', scoreRef.current).catch(() => {});
      }
    };
  }, [user]);

  // Countdown timer while playing: ticks once per second
  useEffect(() => {
    if (phase !== 'playing') return;

    const timerId = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase]);

  // Trigger finalize when timeLeft reaches 0
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      finalizeGame(scoreRef.current);
    }
  }, [phase, timeLeft, finalizeGame]);

  function startGame() {
    clearTimeout(feedbackTimer.current);
    gameId.current += 1;
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_SECONDS);
    setPicked(null);
    setIsNewBest(false);
    setQuestion(buildQuestion(signs));
    setPhase('playing');
  }

  function handleAnswer(option) {
    if (picked) return; // ignore clicks during feedback
    setPicked(option.id);
    if (option.id === question.answer.id) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    feedbackTimer.current = setTimeout(() => {
      setPicked(null);
      setQuestion((q) => buildQuestion(signs, q.answer.id));
    }, FEEDBACK_MS);
  }

  function handleBackClick() {
    if (phase === 'playing') {
      finalizeGame(scoreRef.current);
    }
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
        <Link to="/dashboard" className={styles.back} onClick={handleBackClick}>
          &larr; Back to Dashboard
        </Link>

        {phase === 'start' && (
          <section className={styles.center}>
            <h1>Speed Quiz</h1>
            <p>
              Identify as many Indian Sign Language letters and numbers as you
              can in {GAME_SECONDS} seconds.
            </p>
            <p>Best score: <strong>{best}</strong></p>
            <button className={styles.primary} onClick={startGame} disabled={!bestReady}>
              Start Quiz
            </button>
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

            <button
              type="button"
              className={styles.finishBtn}
              onClick={() => finalizeGame(scoreRef.current)}
            >
              Finish &amp; Save Score ({score} {score === 1 ? 'pt' : 'pts'})
            </button>
          </section>
        )}

        {phase === 'result' && (
          <section className={styles.center}>
            <h1>{timeLeft <= 0 ? "Time's up!" : 'Quiz Finished!'}</h1>
            <p className={styles.bigScore}>{score}</p>
            <p>correct answers</p>
            {isNewBest && <p className={styles.newBest}>New best score! 🏆</p>}
            <p>Best score: <strong>{best}</strong></p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button className={styles.primary} onClick={startGame} style={{ margin: 0 }}>
                Play again
              </button>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 1.5rem',
                  minHeight: '54px',
                  borderRadius: '9999px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-primary)',
                  border: '2px solid var(--color-border-strong)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                View on Dashboard ➔
              </Link>
            </div>
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