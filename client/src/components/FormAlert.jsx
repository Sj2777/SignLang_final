export default function FormAlert({ children, tone = 'error', className = '' }) {
  if (!children) return null;

  const role = tone === 'error' ? 'alert' : 'status';
  const classes = ['form-alert', `form-alert-${tone}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role={role} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
      {children}
    </div>
  );
}
