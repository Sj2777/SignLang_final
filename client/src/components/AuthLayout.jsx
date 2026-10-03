import { Link } from 'react-router-dom';

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  sideLabel,
  sideTitle,
  sideDescription,
  sideVisual,
  footerText,
  footerLink,
  footerLinkText,
  children,
}) {
  return (
    <div className="page-wrap auth-wrap">
      <aside className="auth-side">
        <p className="path-number">{sideLabel}</p>
        <h1>{sideTitle}</h1>
        <p>{sideDescription}</p>
        <div className="auth-visual-content" aria-label="Decorative illustration">
          {sideVisual}
        </div>
      </aside>

      <section className="auth-form-side">
        <p className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</p>
        <h2 className="auth-page-heading">{title}</h2>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}

        {children}

        {footerText && (
          <p className="auth-switch">
            {footerText}{' '}
            <Link to={footerLink}>{footerLinkText}</Link>
          </p>
        )}
      </section>
    </div>
  );
}

export function FormAlert({ tone = 'error', children }) {
  return <div className={`form-alert form-alert-${tone}`}>{children}</div>;
}
