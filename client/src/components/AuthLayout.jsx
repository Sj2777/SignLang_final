function AuthIllustration() {
  return (
    <div className="auth-illustration" aria-hidden="true">
      <span className="auth-orbit auth-orbit-one">learn</span>
      <span className="auth-orbit auth-orbit-two">together</span>
      <svg viewBox="0 0 160 150" fill="none">
        <path d="M41 104c-8-19-7-34 5-43l13 11 2-36c1-8 13-8 13 1v25l7-12c4-7 14-3 12 4l-4 11 6-5c6-5 14 2 10 8l-4 7c8-6 16 2 13 8l-10 25c-6 15-20 24-38 24-14 0-27-10-33-28Z" fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function AuthLayout({
  children,
  visualEyebrow = 'A LITTLE SPACE TO GROW',
  visualTitle = 'Your next conversation starts here.',
  visualDescription = 'Learn at your own pace. Practice with people who understand that every new sign takes time.',
  visualContent = <AuthIllustration />,
  visualLabel = 'Sign language illustration',
}) {
  return (
    <main className="auth-wrap">
      <aside className="auth-side" aria-label="About HandSpeak">
        <span className="path-number">{visualEyebrow}</span>
        <h1>{visualTitle}</h1>
        <p>{visualDescription}</p>
        <div className="auth-visual-content" role="group" aria-label={visualLabel}>
          {visualContent}
        </div>
      </aside>
      <section className="auth-form-side" aria-label="Account form">
        {children}
      </section>
    </main>
  );
}
