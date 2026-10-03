import { useState } from 'react';
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
  const [accountType, setAccountType] = useState(null); // null means hasn't chosen yet
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Learner name or Org name
  const [contactNum, setContactNum] = useState(''); // Org only
  const [address, setAddress] = useState(''); // Org only

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setAccountType(null); // Reset selection when switching modes
    setError('');
  };

  const handleSelectAccountType = (type) => {
    setAccountType(type);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        
        alert('Account created! (If email confirmation is enabled, check your inbox)');
        navigate('/dashboard'); 
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we show the large Selection Cards
  const showSelectionCards = isSignUp && !accountType;

  return (
    <div className={styles.authContainer}>
      <Link to="/" className={styles.backLink}>← Back to Home</Link>
      
      {/* We make the card wider if showing selection cards */}
      <div className={styles.authCard} style={showSelectionCards ? { maxWidth: '700px' } : {}}>
        <h2>{isSignUp ? (accountType ? `Sign Up as ${accountType === 'learner' ? 'Learner' : 'Organization'}` : 'Join the Community') : 'Welcome Back'}</h2>
        
        <p className={styles.subtitle}>
          {isSignUp 
            ? (accountType ? 'Fill in your details below to create your account.' : 'Choose how you want to use HandSpeak.')
            : 'Log in to your HandSpeak dashboard.'}
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {showSelectionCards ? (
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
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
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

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
            </button>
          </form>
        )}

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
      </div>
    </div>
  );
}