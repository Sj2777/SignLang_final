import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './OrgProfileForm.module.css';

const ORG_CATEGORIES = [
  'Deaf School / Education',
  'Sign Language NGO / Charity',
  'Interpreting Agency',
  'Government / Public Service',
  'Healthcare Provider',
  'Community Advocacy Group',
  'Technology / Research',
  'Religious / Faith-based',
  'Other',
];

/* ── Reusable field wrapper ──────────────────────────────── */
function Field({ label, id, required, icon, error, hint, children }) {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={styles.inputWrap}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        {children}
      </div>
      {error && (
        <span className={styles.errorMsg} role="alert" aria-live="polite">
          ⚠ {error}
        </span>
      )}
      {hint && !error && <span className={styles.hintMsg}>{hint}</span>}
    </div>
  );
}

/* ── Step progress indicator ─────────────────────────────── */
function StepDots({ current, total }) {
  return (
    <div className={styles.stepDots} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${styles.dot} ${i < current ? styles.dotDone : ''} ${i === current - 1 ? styles.dotActive : ''}`}
        />
      ))}
    </div>
  );
}

/* ── Main OrgProfileForm ─────────────────────────────────── */
export default function OrgProfileForm() {
  const { user, completeOrgProfile, authLoading, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    orgName:      '',
    regNo:        '',
    category:     '',
    address:      '',
    contactName:  '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) setErrors(e2 => ({ ...e2, [field]: '' }));
  };

  /* ── Validation ── */
  function validate() {
    const e = {};
    if (!form.orgName.trim())      e.orgName = 'Organization name is required.';
    if (!form.regNo.trim())        e.regNo = 'Registration / license number is required.';
    if (!form.category)            e.category = 'Please select an organization category.';
    if (!form.address.trim())      e.address = 'Full address is required.';
    if (!form.contactName.trim())  e.contactName = 'Contact person name is required.';
    if (!form.contactPhone.trim()) e.contactPhone = 'Contact phone number is required.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length) return;

    // ── TODO: Wire to PUT /api/organizations/me/profile ───────────────────
    // completeOrgProfile() in AuthContext handles the fetch call.
    // The payload below maps directly to what the backend expects.
    const result = await completeOrgProfile(form);

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => navigate('/org-dashboard', { replace: true }), 1500);
    }
  }

  /* ── Render ── */
  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orbViolet} />
        <div className={styles.grid} />
      </div>

      <div className={styles.card} role="main">
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.avatar} aria-hidden="true">
            {user?.picture
              ? <img src={user.picture} alt="" className={styles.avatarImg} />
              : <span>{user?.name?.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div>
            <h1 className={styles.heading}>Complete your profile</h1>
            <p className={styles.sub}>
              Signed in as <strong>{user?.email}</strong>.<br />
              Tell us about your organization before accessing your dashboard.
            </p>
          </div>
        </div>

        <StepDots current={2} total={2} />

        {/* Success state */}
        {submitted ? (
          <div className={styles.successBanner} role="status">
            <div className={styles.successIcon}>✅</div>
            <div>
              <div className={styles.successTitle}>Profile saved!</div>
              <div className={styles.successSub}>Redirecting you to your dashboard…</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-label="Organization profile form">
            {/* API error banner */}
            {authError && (
              <div className={styles.errorBanner} role="alert">
                <span>⚠</span> {authError}
                <button className={styles.errorDismiss} onClick={clearError} type="button" aria-label="Dismiss">✕</button>
              </div>
            )}

            <Field label="Organization name" id="op-orgName" required icon="🏢" error={errors.orgName}>
              <input
                id="op-orgName" type="text"
                className={`${styles.input} ${errors.orgName ? styles.inputError : ''}`}
                value={form.orgName} onChange={set('orgName')}
                placeholder="Deaf Connect Foundation"
                autoFocus
              />
            </Field>

            <div className={styles.row2}>
              <Field label="Registration / License No." id="op-regNo" required icon="📋" error={errors.regNo}>
                <input
                  id="op-regNo" type="text"
                  className={`${styles.input} ${errors.regNo ? styles.inputError : ''}`}
                  value={form.regNo} onChange={set('regNo')}
                  placeholder="REG-123456"
                />
              </Field>

              <Field label="Organization type" id="op-category" required error={errors.category}>
                <select
                  id="op-category"
                  className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                  value={form.category} onChange={set('category')}
                >
                  <option value="">Select type…</option>
                  {ORG_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Full address" id="op-address" required icon="🗺️" error={errors.address}>
              <input
                id="op-address" type="text" autoComplete="street-address"
                className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                value={form.address} onChange={set('address')}
                placeholder="123 Main St, City, Country"
              />
            </Field>

            <div className={styles.row2}>
              <Field label="Contact person" id="op-contactName" required icon="🧑" error={errors.contactName}>
                <input
                  id="op-contactName" type="text"
                  className={`${styles.input} ${errors.contactName ? styles.inputError : ''}`}
                  value={form.contactName} onChange={set('contactName')}
                  placeholder="Full name"
                />
              </Field>

              <Field label="Contact phone" id="op-contactPhone" required icon="📞" error={errors.contactPhone}>
                <input
                  id="op-contactPhone" type="tel" autoComplete="tel"
                  className={`${styles.input} ${errors.contactPhone ? styles.inputError : ''}`}
                  value={form.contactPhone} onChange={set('contactPhone')}
                  placeholder="+1 555 000 0000"
                />
              </Field>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={authLoading}
              id="complete-profile-submit"
              aria-busy={authLoading}
            >
              {authLoading ? (
                <><div className={styles.spinner} /> Saving profile…</>
              ) : (
                <>Save & Continue to Dashboard →</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
