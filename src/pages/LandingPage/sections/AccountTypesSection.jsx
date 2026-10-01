import { useNavigate } from 'react-router-dom';
import styles from './AccountTypesSection.module.css';

const HandShakeSVG = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const GroupSVG = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AccountTypesSection({ onNavigate }) {
  const navigate = useNavigate();

  return (
    <section className={styles.section} id="account-types" aria-labelledby="accounts-heading">
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>Community</div>
          <h2 id="accounts-heading" className={styles.heading}>
            Join the community
          </h2>
          <p className={styles.sub}>
            LinkHands is built for both passionate learners and the organizations that support them.
          </p>
        </header>

        <div className={styles.cardsWrap}>
          {/* ── Client Card ── */}
          <article className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.iconWrap} style={{ color: 'var(--color-primary)' }}>
                <HandShakeSVG />
              </div>
              <h3 className={styles.cardTitle}>Learner</h3>
              <p className={styles.cardSub}>For individuals learning sign language.</p>
            </div>

            <ul className={styles.featureList} aria-label="Learner features">
              <li><span className={styles.check} style={{color: 'var(--color-primary)'}}><CheckIcon /></span> Full AI translation access</li>
              <li><span className={styles.check} style={{color: 'var(--color-primary)'}}><CheckIcon /></span> Offline study materials</li>
              <li><span className={styles.check} style={{color: 'var(--color-primary)'}}><CheckIcon /></span> Weekly progress reports</li>
              <li><span className={styles.check} style={{color: 'var(--color-primary)'}}><CheckIcon /></span> Community leaderboards</li>
            </ul>

            <button 
              className={styles.btnPrimary} 
              onClick={() => onNavigate ? onNavigate('client') : navigate('/dashboard')}
            >
              Start Learning Free
            </button>
          </article>

          {/* ── Organization Card ── */}
          <article className={`${styles.card} ${styles.cardOrg}`}>
            <div className={styles.cardTop}>
              <div className={styles.iconWrap} style={{ color: 'var(--color-accent)' }}>
                <GroupSVG />
              </div>
              <h3 className={styles.cardTitle}>Organization</h3>
              <p className={styles.cardSub}>For schools, agencies, and Deaf advocacy groups.</p>
            </div>

            <ul className={styles.featureList} aria-label="Organization features">
              <li><span className={styles.check} style={{color: 'var(--color-accent)'}}><CheckIcon /></span> Verified community badge</li>
              <li><span className={styles.check} style={{color: 'var(--color-accent)'}}><CheckIcon /></span> Host & list local events</li>
              <li><span className={styles.check} style={{color: 'var(--color-accent)'}}><CheckIcon /></span> Reach eager learners</li>
              <li><span className={styles.check} style={{color: 'var(--color-accent)'}}><CheckIcon /></span> Analytics & outreach tools</li>
            </ul>

            <button 
              className={styles.btnAccent} 
              onClick={() => navigate('/org-dashboard')}
            >
              Register your Organization
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
