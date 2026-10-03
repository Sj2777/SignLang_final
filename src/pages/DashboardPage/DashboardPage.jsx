import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Welcome back!</h1>
        <p>Ready to continue your sign language journey?</p>
      </header>

      <div className={styles.grid}>
        <Link to="/translate" className={styles.card}>
          <div className={styles.icon}>📷</div>
          <h2>Live Translator</h2>
          <p>Practice signs with real-time AI feedback.</p>
        </Link>
        
        <Link to="/reverse-translate" className={styles.card}>
          <div className={styles.icon}>⌨️</div>
          <h2>Text to ISL</h2>
          <p>Type or speak to see the sign language translation.</p>
        </Link>
        
        <Link to="/speed-quiz" className={styles.card}>
          <div className={styles.icon}>🎮</div>
          <h2>Speed Quiz</h2>
          <p>Test your knowledge in a gamified speed run.</p>
        </Link>
      </div>
    </div>
  );
}
