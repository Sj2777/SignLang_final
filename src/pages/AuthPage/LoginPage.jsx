import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [accountType, setAccountType] = useState('learner'); // 'learner' or 'organization'
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
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
        
        // Supabase returns a session if email confirmation is off
        // Or if it's on, we alert them
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

  return (
    <div className={styles.authContainer}>
      <Link to="/" className={styles.backLink}>? Back to Home</Link>
      <div className={styles.authCard}>
        <h2>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
        <p className={styles.subtitle}>
          {isSignUp 
            ? 'Sign up to access HandSpeak learning tools.' 
            : 'Log in to your HandSpeak dashboard.'}
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Account Type Selector (Only on Sign Up) */}
          {isSignUp && (
            <div className={styles.accountTypeSelector}>
              <button 
                type="button" 
                className={accountType === 'learner' ? styles.typeBtnActive : styles.typeBtn}
                onClick={() => setAccountType('learner')}
              >
                Learner
              </button>
              <button 
                type="button"
                className={accountType === 'organization' ? styles.typeBtnActive : styles.typeBtn}
                onClick={() => setAccountType('organization')}
              >
                Organization
              </button>
            </div>
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
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className={styles.toggleBtn}
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
