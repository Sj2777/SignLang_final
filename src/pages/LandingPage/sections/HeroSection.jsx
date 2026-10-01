import styles from './HeroSection.module.css';

const HeroImage = () => (
  <div className={styles.heroImageWrapper} aria-hidden="true">
    <div className={styles.glowEffect}></div>
    <img 
      src="/hero_sign_language.jpg" 
      alt="3D render of hands performing sign language" 
      className={styles.heroImage}
    />
  </div>
);

export default function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* Organic background shapes instead of cyber grids */}
      <div className={styles.bgBlob} aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="var(--color-primary-subtle)" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96,-18,94.9,-2.8C93.8,12.4,86,27.3,76.5,41.2C67,55.1,55.8,68.1,41.9,76C28,83.9,11.4,86.7,-3.7,83.4C-18.8,80.1,-32.4,70.7,-46.1,62C-59.8,53.3,-73.6,45.3,-82.5,33.1C-91.4,20.9,-95.4,4.5,-90.6,-9.7C-85.8,-23.9,-72.2,-35.9,-59.1,-44.6C-46,-53.3,-33.4,-58.7,-20.9,-65C-8.4,-71.3,4,-78.5,17.4,-81C30.8,-83.5,44.2,-81.3,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className={`container ${styles.inner}`}>
        {/* ── Left / Copy ── */}
        <div className={styles.copy}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            Empowering human connection
          </div>

          <h1 id="hero-heading" className={styles.heading}>
            Speak through <br />
            <span className="drawn-underline">motion</span>
          </h1>

          <p className={styles.sub}>
            Learn sign language naturally, connect with Deaf organizations, 
            and use real-time AI tools. A community platform built for 
            inclusive communication.
          </p>

          <div className={styles.ctas}>
            <a href="#account-types" className={styles.btnPrimary} id="hero-cta-signup">
              Start Learning
            </a>
            <a href="#features" className={styles.btnGhost}>
              Discover features →
            </a>
          </div>

          <div className={styles.trustRow}>
            <div className={styles.avatarStack} aria-label="Community members">
              {/* Solid warm colors instead of gradients for avatars */}
              {['#E05D36','#0F766E','#F59E0B','#475569'].map((c, i) => (
                <div key={i} className={styles.trustAvatar} style={{ background: c }} />
              ))}
            </div>
            <p className={styles.trustText}>
              Join over <strong>2,400</strong> learners and organizations.
            </p>
          </div>
        </div>

        {/* ── Right / Visual ── */}
        <div className={styles.visual} aria-hidden="true">
           <HeroImage />
        </div>
      </div>
    </section>
  );
}
