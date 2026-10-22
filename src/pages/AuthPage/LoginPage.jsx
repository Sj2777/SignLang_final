import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  const [accountType, setAccountType] = useState(null); // null means hasn't chosen yet
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Learner name or Org name
  const [contactNum, setContactNum] = useState(''); // Org only
  const [address, setAddress] = useState(''); // Org only

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
    setAccountType(null); // Reset selection when switching modes
    setError('');
    setSuccessMsg('');
    clearAuthMessage();
  };

  const handleSelectAccountType = (type) => {
    setAccountType(type);
    setError('');
    setSuccessMsg('');
    clearAuthMessage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (isOffline || !navigator.onLine) {
      setError('You need an internet connection for your first login or sign-up on this device.');
      return;
    }
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (!accountType) throw new Error("Please select an account type first.");
        
        const metaData = {
          account_type: accountType,
          name: name,
        };
        
        if (accountType === 'organization') {
          metaData.contact_num = contactNum;
          metaData.address = address;
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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

  // Determine if we show the large Selection Cards
  const showSelectionCards = isSignUp && !accountType;

  const getHeading = () => {
    if (isForgotPassword) return 'Reset Password';
    if (isSignUp) {
      return accountType
        ? `Sign Up as ${accountType === 'learner' ? 'Learner' : 'Organization'}`
        : 'Join the Community';
    }
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (isForgotPassword) return 'Enter your account email and choose a new password.';
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
      
      {/* We make the card wider if showing selection cards */}
      <div className={styles.authCard} style={showSelectionCards ? { maxWidth: '700px' } : {}}>
        <h2>{getHeading()}</h2>
        
        <p className={styles.subtitle}>{getSubtitle()}</p>

        {isOffline && (
          <div className={styles.offlineBanner} role="status">
            You’re offline. Previously signed-in users can continue on this device; your first login or sign-up requires internet.
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

        {isForgotPassword ? (
          /* Forgot / Reset Password Form */
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
              <label>New Password</label>
              <input 
                type="password" 
                required 
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <input 
                type="password" 
                required 
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        ) : showSelectionCards ? (
          <div className={styles.cardSelectionGrid}>
            <div className={styles.selectionCard} onClick={() => handleSelectAccountType('learner')}>
              <div className={styles.iconWrap}>
                <HandShakeSVG />
              </div>
              <h3>Learner</h3>
              <p>For individuals learning sign language.</p>
            </div>
            
            <div className={styles.selectionCard} onClick={() => handleSelectAccountType('organization')}>
              <div className={styles.iconWrap} style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent)' }}>
                <GroupSVG />
              </div>
              <h3>Organization</h3>
              <p>For schools, agencies, and Deaf advocacy groups.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* Show an easy way to go back to selection if signing up */}
            {isSignUp && accountType && (
              <button 
                type="button" 
                onClick={() => setAccountType(null)} 
                className={styles.backBtn}
              >
                ← Change Account Type
              </button>
            )}

            {/* Sign Up Fields */}
            {isSignUp && (
              <>
                <div className={styles.inputGroup}>
                  <label>{accountType === 'organization' ? 'Organization Name' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === 'organization' ? 'Acme Corp' : 'John Doe'}
                  />
                </div>

                {accountType === 'organization' && (
                  <>
                    <div className={styles.inputGroup}>
                      <label>Contact Number</label>
                      <input 
                        type="tel" 
                        required 
                        value={contactNum}
                        onChange={(e) => setContactNum(e.target.value)}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Address</label>
                      <input 
                        type="text" 
                        required 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, City"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Common Fields */}
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
            </div>

            {/* Forgot password button (shown in Login mode) */}
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

            <button type="submit" disabled={loading || isOffline} className={styles.submitBtn}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
            </button>
          </form>
        )}

        {!isForgotPassword && (
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