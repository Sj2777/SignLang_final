import styles from './StatsSection.module.css';

const STATS = [
  { value: '2.4k', label: 'Active Learners' },
  { value: '180+',   label: 'Organizations' },
  { value: '50k',   label: 'Signs Translated' },
  { value: '4.9',   label: 'User Rating' },
];

export default function StatsSection() {
  return (
    <section className={styles.stats} aria-label="Platform statistics">
      <div className={`container ${styles.inner}`}>
        {STATS.map(({ value, label }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.value}>{value}</span>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
