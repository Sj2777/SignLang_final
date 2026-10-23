import { useState, useEffect } from 'react';
import { getPlatformLiveStats } from '../../../lib/liveStats';
import styles from './StatsSection.module.css';

export default function StatsSection() {
  const [stats, setStats] = useState(() => getPlatformLiveStats());

  useEffect(() => {
    const handleUpdate = () => {
      setStats(getPlatformLiveStats());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('handspeak_quiz_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('handspeak_quiz_updated', handleUpdate);
    };
  }, []);

  const statItems = [
    { value: stats.learners, label: 'Registered Learners' },
    { value: stats.organizations, label: 'Partner Organisations' },
    { value: stats.vocabularyClasses, label: 'ISL Vocabulary Signs' },
    { value: stats.totalQuizzes, label: 'Quizzes Completed' },
  ];

  return (
    <section className={styles.stats} aria-label="Real-time platform statistics">
      <div className={`container ${styles.inner}`}>
        {statItems.map(({ value, label }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.value}>{value}</span>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
