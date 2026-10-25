import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, validatePassword, isValidIndianPhone } from '../../lib/crypto';
import styles from './Auth.module.css';

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

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [accountType, setAccountType] = useState(null); // 'learner' | 'organization' | null

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Learner name or Org name
  const [contactNum, setContactNum] = useState(''); // Org only
  const [address, setAddress] = useState(''); // Org only

  // Mobile verification state for organizations
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signUp, resetPassword, isOffline, authMessage, clearAuthMessage } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in on this device, immediately skip login and go to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setIsVerifyingOtp(false);
    setAccountType(null);
    setError('');
    setSuccessMsg('');
    clearAuthMessage();
  };

  const handleSelectAccountType = (type) => {
    setAccountType(type);
    setIsVerifyingOtp(false);
    setError('');
    setSuccessMsg('');
    clearAuthMessage();
  };

  // Real-time password requirement tests
  const pwdChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const validateInputs = () => {
    if (!email.trim()) throw new Error('Please enter your email address.');
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address (e.g. name@example.com).');
    }

    if (isSignUp) {
      if (!name.trim()) {
        throw new Error(accountType === 'organization' ? 'Please enter your organization name.' : 'Please enter your name.');
      }

      const pwdResult = validatePassword(password);
      if (!pwdResult.valid) {
        throw new Error(pwdResult.message);
      }

      if (accountType === 'organization') {
        if (!contactNum.trim() || !isValidIndianPhone(contactNum)) {
          throw new Error('Please enter a valid 10-digit mobile number (e.g. +91 98765 43210).');
        }
        if (!address.trim() || address.trim().length < 5) {
          throw new Error('Please enter a complete organization address (at least 5 characters).');
        }
      }
    } else {
      if (!password) throw new Error('Please enter your password.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      validateInputs();
    } catch (err) {
      setError(err.message);
      return;
    }

    // Organization Mobile Verification Gate
    if (isSignUp && accountType === 'organization' && !isVerifyingOtp) {
      const demoCode = '482910';
      setGeneratedOtp(demoCode);
      setIsVerifyingOtp(true);
      setSuccessMsg(`📱 Verification code sent to ${contactNum}. Use Demo Code: ${demoCode}`);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const metaData = {
          account_type: accountType,
          name: name.trim(),
        };

        if (accountType === 'organization') {
          metaData.contact_num = contactNum.trim();
          metaData.address = address.trim();
          metaData.phone_verified = true;
          metaData.org_status = 'pending'; // Requires approval before public listing
        }

        const { error } = await signUp(email, password, metaData);
        if (error) throw error;

        navigate('/dashboard', { replace: true });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!enteredOtp || enteredOtp.trim() !== generatedOtp) {
      setError(`Invalid verification code. Please enter ${generatedOtp} to complete mobile verification.`);
      return;
    }

    setLoading(true);
    try {
      const metaData = {
        account_type: 'organization',
        name: name.trim(),
        contact_num: contactNum.trim(),
        address: address.trim(),
        phone_verified: true,
        org_status: 'pending',
      };

      const { error } = await signUp(email, password, metaData);
      if (error) throw error;

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const pwdResult = validatePassword(newPassword);
    if (!pwdResult.valid) {
      setError(pwdResult.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email, newPassword);
      if (error) throw error;

      setSuccessMsg('Password updated successfully! You can now log in with your new password.');
      setIsForgotPassword(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSelectionCards = isSignUp && !accountType;

  const getHeading = () => {
    if (isForgotPassword) return 'Reset Password';
    if (isVerifyingOtp) return 'Verify Mobile Number';
    if (isSignUp) {
      return accountType
        ? `Sign Up as ${accountType === 'learner' ? 'Learner' : 'Organization'}`
        : 'Join the Community';
    }
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (isForgotPassword) return 'Enter your account email and choose a strong password.';
    if (isVerifyingOtp) return `Enter the SMS verification code sent to ${contactNum}.`;
    if (isSignUp) {
      return accountType
        ? 'Fill in your details below to create your account.'
        : 'Choose how you want to use HandSpeak.';
    }
    return 'Log in to your HandSpeak dashboard.';
  };

  return (
    <div className={styles.authContainer}>
      <Link to="/" className={styles.backLink}>← Back to Home</Link>

      <div className={styles.authCard} style={showSelectionCards ? { maxWidth: '700px' } : {}}>
        <h2>{getHeading()}</h2>
        <p className={styles.subtitle}>{getSubtitle()}</p>

        {isOffline && (
          <div className={styles.offlineBanner} role="status">
            You’re offline. HandSpeak is running in offline mode. Your credentials are securely cached on this device.
          </div>
        )}
        {successMsg && (
          <div className={styles.successBanner} role="status">
            {successMsg}
          </div>
        )}
        {(error || authMessage) && (
          <div className={styles.errorBanner} role="alert">
            {error || authMessage}
          </div>
        )}

        {/* 1. FORGOT PASSWORD VIEW */}
        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
              className={styles.backBtn}
            >
              ← Back to Log In
            </button>

            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>New Strong Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 symbol"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        ) : isVerifyingOtp ? (
          /* 2. ORGANIZATION MOBILE OTP VERIFICATION STEP */
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.otpBox}>
              <p className={styles.otpHint}>
                Security Requirement: Accredited organizations must verify their official contact number before onboarding.
              </p>

              <div className={styles.inputGroup}>
                <label>6-Digit SMS Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className={styles.otpInput}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  autoFocus
                />
              </div>

              <div>
                <span className={styles.demoOtpBadge}>Demo OTP Code: {generatedOtp}</span>
              </div>
            </div>

            <button type="submit" disabled={loading || enteredOtp.length < 6} className={styles.submitBtn}>
              {loading ? 'Verifying Mobile...' : 'Verify Mobile & Create Account'}
            </button>

            <button
              type="button"
              onClick={() => setIsVerifyingOtp(false)}
              className={styles.backBtn}
              style={{ marginTop: '0.5rem' }}
            >
              ← Edit Details
            </button>
          </form>
        ) : showSelectionCards ? (
          /* 3. ACCOUNT TYPE PICKER */
          <div className={styles.cardSelectionGrid}>
            <div className={styles.selectionCard} onClick={() => handleSelectAccountType('learner')}>
              <div className={styles.iconWrap}>
                <HandShakeSVG />
              </div>
              <h3>Learner</h3>
              <p>For individuals learning sign language and taking quizzes.</p>
            </div>

            <div className={styles.selectionCard} onClick={() => handleSelectAccountType('organization')}>
              <div className={styles.iconWrap} style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)' }}>
                <GroupSVG />
              </div>
              <h3>Organization</h3>
              <p>For verified schools, NGOs, and Deaf community chapters.</p>
            </div>
          </div>
        ) : (
          /* 4. MAIN SIGNUP / LOGIN FORM */
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {isSignUp && accountType && (
              <button
                type="button"
                onClick={() => setAccountType(null)}
                className={styles.backBtn}
              >
                ← Change Account Type
              </button>
            )}

            {isSignUp && (
              <>
                <div className={styles.inputGroup}>
                  <label>{accountType === 'organization' ? 'Organization Name' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === 'organization' ? 'e.g. Deaf Welfare Association' : 'e.g. John Doe'}
                  />
                </div>

                {accountType === 'organization' && (
                  <>
                    <div className={styles.inputGroup}>
                      <label>Official Contact Number (Mobile / SMS)</label>
                      <input
                        type="tel"
                        required
                        value={contactNum}
                        onChange={(e) => setContactNum(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Headquarters / Registered Address</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 12/A, Institutional Area, City, State"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              {/* Real-time strong password rules checklist during sign-up */}
              {isSignUp && (
                <div className={styles.pwdRules}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.15rem' }}>
                    Password Strength Requirements:
                  </span>
                  <div className={`${styles.ruleItem} ${pwdChecks.length ? styles.ruleValid : ''}`}>
                    <span>{pwdChecks.length ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`${styles.ruleItem} ${pwdChecks.upper ? styles.ruleValid : ''}`}>
                    <span>{pwdChecks.upper ? '✓' : '○'}</span>
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`${styles.ruleItem} ${pwdChecks.number ? styles.ruleValid : ''}`}>
                    <span>{pwdChecks.number ? '✓' : '○'}</span>
                    <span>At least 1 digit (0-9)</span>
                  </div>
                  <div className={`${styles.ruleItem} ${pwdChecks.special ? styles.ruleValid : ''}`}>
                    <span>{pwdChecks.special ? '✓' : '○'}</span>
                    <span>At least 1 special character (!, @, #, etc.)</span>
                  </div>
                </div>
              )}
            </div>

            {!isSignUp && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                  className={styles.forgotBtn}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Processing...' : (isSignUp ? (accountType === 'organization' ? 'Continue to Mobile Verification →' : 'Create Account') : 'Log In')}
            </button>
          </form>
        )}

        {!isForgotPassword && !isVerifyingOtp && (
          <div className={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={handleToggleMode}
              className={styles.toggleBtn}
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
