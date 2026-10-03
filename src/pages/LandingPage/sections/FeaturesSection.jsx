import styles from './FeaturesSection.module.css';

/* Replace generic emojis with minimalist SVGs (using Lucide paths as a base but styled flat) */
const ICONS = {
  ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  offline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  progress: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  leaderboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  org: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>,
  events: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
};

const FEATURES = [
  {
    icon: ICONS.camera,
    title: 'Live Sign-to-Text',
    desc: 'Use your camera for real-time sign recognition. Our AI converts gestures to readable text instantly.',
    tag: 'Real-Time',
    color: 'var(--color-primary)',
  },
  {
    icon: ICONS.ai,
    title: 'Text-to-Sign Translator',
    desc: 'Type or speak any word, and watch our virtual system translate it into sign language sequences.',
    tag: 'AI Tools',
    color: 'var(--color-accent)',
  },
  {
    icon: ICONS.leaderboard,
    title: 'Speed Quiz Game',
    desc: 'Test your knowledge in a gamified speed run. See how fast you can accurately reproduce signs.',
    tag: 'Gamified',
    color: '#059669',
  },
  {
    icon: ICONS.progress,
    title: 'Track Your Progress',
    desc: 'Visualize your learning with streaks and skill maps built right into your personalized dashboard.',
    tag: 'Analytics',
    color: '#D97706',
  },
  {
    icon: ICONS.org,
    title: 'Organization Portal',
    desc: 'Specialized accounts for schools and Deaf advocacy groups to manage their learners and outreach.',
    tag: 'Community',
    color: 'var(--color-primary)',
  },
  {
    icon: ICONS.globe,
    title: 'Regional Support',
    desc: 'Localized specifically for Indian Sign Language (ISL) with Marathi Devanagari output support.',
    tag: 'Localized',
    color: 'var(--color-accent)',
  },
];

function FeatureCard({ icon, title, desc, tag, color }) {
  return (
    <article className={styles.card} style={{ '--card-color': color }}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <span className={styles.tag}>{tag}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{desc}</p>
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section className={styles.section} id="features" aria-labelledby="features-heading">
      <div className="container">
        <header className={styles.header}>
          <div className={styles.eyebrow}>Features</div>
          <h2 id="features-heading" className={styles.heading}>
            Everything you need to learn and <em>connect</em>.
          </h2>
          <p className={styles.sub}>
            From personalized lessons to finding local community events, 
            HandSpeak gives you the tools to thrive in the sign language world.
          </p>
        </header>

        <div className={styles.grid}>
          {FEATURES.map(f => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
