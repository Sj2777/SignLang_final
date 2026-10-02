import { useId, useState } from 'react';

export default function PasswordField({
  id,
  label = 'Password',
  hint,
  error,
  className = '',
  'aria-describedby': externalDescribedBy,
  ...inputProps
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [externalDescribedBy, hintId, errorId]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input-wrap">
        <input
          {...inputProps}
          className="form-input"
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {visible
              ? <><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2-2.2 3" /><path d="M6.2 6.2A12 12 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7 1 0 1.9-.2 2.8-.5" /></>
              : <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
      </div>
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}
