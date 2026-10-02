import { useId } from 'react';

export default function TextField({
  id,
  label,
  hint,
  error,
  className = '',
  'aria-describedby': externalDescribedBy,
  ...inputProps
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [externalDescribedBy, hintId, errorId]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <input
        className="form-input"
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}
