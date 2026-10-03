import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AuthLayout, FormAlert } from './components/AuthLayout.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

const accountOptions = {
  individual: {
    title: 'I\'m an individual',
    description: 'Learn at your own pace, practice regularly, and build confidence with a supportive ASL community.',
    route: '/login/individual',
    signupRoute: '/signup/individual',
    badge: 'Learner',
  },
  organization: {
    title: 'I\'m an organization',
    description: 'Create a welcoming learning space for your school, team, or service with accessible communication tools.',
    route: '/login/organization',
    signupRoute: '/signup/organization',
    badge: 'Organization',
  },
};

function ProtectedRoute({ children, requiredAccountType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="app-loading" role="status">Checking your sign-in…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAccountType && user.accountType !== requiredAccountType) {
    return <Navigate to={`/dashboard/${user.accountType}`} replace />;
  }

  return children;
}

function AppShell() {
  const { user, signOut, isOffline } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith('/login') || location.pathname.startsWith('/signup');

  return (
    <>
      {isOffline && (
        <div className="offline-banner" role="status">
          You're offline. Showing your saved profile and the pages available on this device.
        </div>
      )}
      <header className="site-header">
        <div className="header-inner">
          <Link className="wordmark" to="/" aria-label="HandSpeak home">
            <span className="wordmark-mark">H</span>
            HandSpeak
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/learn">Learn</NavLink>
            <NavLink to="/community">Community</NavLink>
          </nav>

          <div className="header-action">
            {user ? (
              <>
                <span className="user-greeting">Hi, {user.name?.split(' ')[0] || 'friend'}</span>
                <button className="button button-small button-outline" type="button" onClick={signOut}>Sign out</button>
              </>
            ) : (
              !isAuthPage && <Link className="sign-in-link" to="/login">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:slug" element={<LessonPage />} />
          <Route path="/community" element={<CommunityPage />} />

          <Route path="/login" element={<LoginChooserPage />} />
          <Route path="/login/:accountType" element={<AuthFormPage mode="login" />} />
          <Route path="/signup" element={<SignupChooserPage />} />
          <Route path="/signup/:accountType" element={<AuthFormPage mode="signup" />} />

          <Route path="/dashboard/individual" element={<ProtectedRoute requiredAccountType="individual"><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/organization" element={<ProtectedRoute requiredAccountType="organization"><DashboardPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-wordmark wordmark">
          <span className="wordmark-mark">H</span>
          HandSpeak
        </div>
        <p>Practice with patience, community, and a little courage.</p>
      </footer>
    </>
  );
}

function LoginChooserPage() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/dashboard/${user.accountType}`} replace />;

  return (
    <div className="page-wrap auth-wrap">
      <aside className="auth-side">
        <p className="path-number">Welcome back</p>
        <h1>Choose the right place to sign in.</h1>
        <p>Pick the account that matches your learning or organization goals.</p>
        <div className="auth-visual-content" aria-label="Account chooser illustration">
          <div className="auth-illustration" aria-hidden="true">
            <span className="auth-orbit auth-orbit-one">learn</span>
            <span className="auth-orbit auth-orbit-two">together</span>
            <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M41 104c-8-19-7-34 5-43l13 11 2-36c1-8 13-8 13 1v25l7-12c4-7 14-3 12 4l-4 11 6-5c6-5 14 2 10 8l-4 7c8-6 16 2 13 8l-10 25c-6 15-20 24-38 24-14 0-27-10-33-28Z" fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </aside>

      <section className="auth-form-side">
        <p className="eyebrow"><span className="eyebrow-line" /> Sign in</p>
        <h2 className="auth-page-heading">How are you joining today?</h2>
        <p className="auth-subtitle">Choose the account type that fits your goals.</p>

        <div className="account-choice-list">
          {Object.entries(accountOptions).map(([key, option]) => (
            <Link key={key} to={option.route} className={`account-choice ${key === 'organization' ? 'account-choice-organization' : ''}`}>
              <div className="account-choice-icon">
                {key === 'individual' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 7a7 7 0 0 1 14 0" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 18.5V8.5A2.5 2.5 0 0 1 6.5 6H17.5A2.5 2.5 0 0 1 20 8.5v10" />
                    <path d="M6 10h12M8 14h8" />
                  </svg>
                )}
              </div>
              <div className="account-choice-copy">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
                <span className="account-choice-action">Continue <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </div>

        <p className="auth-switch auth-switch-secondary">
          Need an account? <Link to="/signup">Choose a sign-up path</Link>
        </p>
      </section>
    </div>
  );
}

function SignupChooserPage() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/dashboard/${user.accountType}`} replace />;

  return (
    <div className="page-wrap auth-wrap">
      <aside className="auth-side">
        <p className="path-number">Create account</p>
        <h1>Start building your ASL practice.</h1>
        <p>Choose the path that fits your community and your learning goals.</p>
        <div className="auth-visual-content" aria-label="Account chooser illustration">
          <div className="auth-illustration" aria-hidden="true">
            <span className="auth-orbit auth-orbit-one">start</span>
            <span className="auth-orbit auth-orbit-two">here</span>
            <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M56 106c-6-19 1-33 17-42l18 15 2-35c1-8 13-9 15 0l2 35 13-14c8-9 23-5 23 4v18l14-11c10-8 21 6 13 16l-19 21c-12 13-30 21-49 21-16 0-31-8-39-21Z" fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </aside>

      <section className="auth-form-side">
        <p className="eyebrow"><span className="eyebrow-line" /> Join</p>
        <h2 className="auth-page-heading">Which account sounds right?</h2>
        <p className="auth-subtitle">Pick the audience you want to create for.</p>

        <div className="account-choice-list">
          {Object.entries(accountOptions).map(([key, option]) => (
            <Link key={key} to={option.signupRoute} className={`account-choice ${key === 'organization' ? 'account-choice-organization' : ''}`}>
              <div className="account-choice-icon">
                {key === 'individual' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 7a7 7 0 0 1 14 0" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 18.5V8.5A2.5 2.5 0 0 1 6.5 6H17.5A2.5 2.5 0 0 1 20 8.5v10" />
                    <path d="M6 10h12M8 14h8" />
                  </svg>
                )}
              </div>
              <div className="account-choice-copy">
                <strong>{option.title}</strong>
                <span>{option.description}</span>
                <span className="account-choice-action">Create account <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </div>

        <p className="auth-switch auth-switch-secondary">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

function AuthFormPage({ mode }) {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { accountType = 'individual' } = useParams();
  const isSignup = mode === 'signup';
  const selectedType = accountType === 'organization' ? 'organization' : 'individual';

  const defaultProfile = selectedType === 'individual'
    ? { fullName: '' }
    : {
        organizationName: '',
        organizationType: 'school',
        contactPersonName: '',
        website: '',
      };

  const [form, setForm] = useState({ email: '', password: '' });
  const [profile, setProfile] = useState(defaultProfile);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(`/dashboard/${user.accountType}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setForm({ email: '', password: '' });
    setProfile(defaultProfile);
    setFormErrors({});
    setError('');
    setShowPassword(false);
  }, [selectedType, mode]);

  const pageContent = {
    individual: {
      login: {
        sideLabel: 'Learner',
        sideTitle: 'Good to see you again.',
        sideDescription: 'Sign in to pick up where you left off and keep growing your ASL practice.',
        eyebrow: 'Welcome back',
        title: 'Sign in to your learner account',
        subtitle: 'Continue your practice, revisit lessons, and stay close to the community.',
      },
      signup: {
        sideLabel: 'Learner',
        sideTitle: 'Your learning starts here.',
        sideDescription: 'Create your learner profile and give yourself a welcoming place to practice.',
        eyebrow: 'Join',
        title: 'Create your individual account',
        subtitle: 'Build a steady learning rhythm with prompts, support, and encouragement.',
      },
    },
    organization: {
      login: {
        sideLabel: 'Organization',
        sideTitle: 'Welcome back to your work.',
        sideDescription: 'Sign in to continue building accessibility, learning, and connection for your team.',
        eyebrow: 'Welcome back',
        title: 'Sign in to your organization account',
        subtitle: 'Keep your learning community moving with clarity and care.',
      },
      signup: {
        sideLabel: 'Organization',
        sideTitle: 'Expand your community with purpose.',
        sideDescription: 'Create an organization account and make room for meaningful connection and practice.',
        eyebrow: 'Join',
        title: 'Create your organization account',
        subtitle: 'Bring together learning, support, and communication in one place.',
      },
    },
  };

  const content = pageContent[selectedType][mode];
  const emailLabel = selectedType === 'organization' && mode === 'signup' ? 'Work email' : 'Email';

  const sideVisual = (
    <div className="auth-illustration" aria-hidden="true">
      <span className={`auth-orbit auth-orbit-one ${selectedType === 'organization' ? 'organization' : ''}`}>{selectedType === 'individual' ? 'learn' : 'team'}</span>
      <span className={`auth-orbit auth-orbit-two ${selectedType === 'organization' ? 'organization' : ''}`}>{selectedType === 'individual' ? 'together' : 'care'}</span>
      <svg viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={selectedType === 'individual'
          ? 'M41 104c-8-19-7-34 5-43l13 11 2-36c1-8 13-8 13 1v25l7-12c4-7 14-3 12 4l-4 11 6-5c6-5 14 2 10 8l-4 7c8-6 16 2 13 8l-10 25c-6 15-20 24-38 24-14 0-27-10-33-28Z'
          : 'M47 104c-8-17-5-34 12-43l10 11 4-29c1-8 13-8 14 1v25l10-12c5-7 15-3 15 6v19l10-9c7-6 17 1 14 11l-9 20c-7 15-20 23-37 23H74c-14 0-25-9-27-19Z'} fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  function validateField(name, value) {
    if (mode === 'login') {
      if (name === 'email') {
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
      }
      if (name === 'password') {
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
      }
      return '';
    }

    if (selectedType === 'individual') {
      if (name === 'fullName') {
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Please enter your full name.';
      }
    } else {
      if (name === 'organizationName') {
        if (!value.trim()) return 'Organization name is required.';
      }
      if (name === 'organizationType') {
        if (!value) return 'Please choose an organization type.';
      }
      if (name === 'contactPersonName') {
        if (!value.trim()) return 'Contact person name is required.';
      }
      if (name === 'website') {
        if (value && !/^https?:\/\//i.test(value.trim())) return 'Website must start with http:// or https://.';
      }
    }

    if (name === 'email') {
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
    }

    if (name === 'password') {
      if (!value) return 'Password is required.';
      if (value.length < 8) return 'Password must be at least 8 characters.';
    }

    return '';
  }

  function validateForm() {
    const nextErrors = {};

    if (selectedType === 'individual' && mode === 'signup') {
      const fullNameError = validateField('fullName', profile.fullName);
      if (fullNameError) nextErrors.fullName = fullNameError;
    }

    if (selectedType === 'organization' && mode === 'signup') {
      const orgNameError = validateField('organizationName', profile.organizationName);
      if (orgNameError) nextErrors.organizationName = orgNameError;
      const typeError = validateField('organizationType', profile.organizationType);
      if (typeError) nextErrors.organizationType = typeError;
      const contactNameError = validateField('contactPersonName', profile.contactPersonName);
      if (contactNameError) nextErrors.contactPersonName = contactNameError;
      const websiteError = validateField('website', profile.website);
      if (websiteError) nextErrors.website = websiteError;
    }

    const emailError = validateField('email', form.email);
    if (emailError) nextErrors.email = emailError;
    const passwordError = validateField('password', form.password);
    if (passwordError) nextErrors.password = passwordError;

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = selectedType === 'individual' ? {
        email: form.email.trim(),
        password: form.password,
        profile: { fullName: profile.fullName.trim() },
      } : {
        email: form.email.trim(),
        password: form.password,
        profile: {
          organizationName: profile.organizationName.trim(),
          organizationType: profile.organizationType,
          contactPersonName: profile.contactPersonName.trim(),
          contactPhone: '',
          website: profile.website.trim(),
        },
      };

      if (mode === 'signup') {
        await signUp(selectedType, payload);
      } else {
        await signIn(selectedType, { email: form.email.trim(), password: form.password });
      }

      navigate(`/dashboard/${selectedType}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setIsSubmitting(false);
    }
  }

  function updateField(name, value) {
    setError('');
    setFormErrors((current) => ({ ...current, [name]: validateField(name, value) }));
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateProfileField(name, value) {
    setError('');
    setFormErrors((current) => ({ ...current, [name]: validateField(name, value) }));
    setProfile((current) => ({ ...current, [name]: value }));
  }

  return (
    <AuthLayout
      eyebrow={content.eyebrow}
      title={content.title}
      subtitle={content.subtitle}
      sideLabel={content.sideLabel}
      sideTitle={content.sideTitle}
      sideDescription={content.sideDescription}
      sideVisual={sideVisual}
      footerText={mode === 'login' ? 'Need an account?' : 'Already have an account?'}
      footerLink={mode === 'login' ? `/signup/${selectedType}` : `/login/${selectedType}`}
      footerLinkText={mode === 'login' ? 'Create one' : 'Sign in'}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {selectedType === 'individual' && mode === 'signup' && (
          <div className="form-field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              className="form-input"
              type="text"
              value={profile.fullName}
              onChange={(event) => updateProfileField('fullName', event.target.value)}
              aria-invalid={Boolean(formErrors.fullName)}
              placeholder="Alex Rivera"
            />
            {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
          </div>
        )}

        {selectedType === 'organization' && mode === 'signup' && (
          <>
            <div className="form-field">
              <label htmlFor="organizationName">Organization name</label>
              <input
                id="organizationName"
                className="form-input"
                type="text"
                value={profile.organizationName}
                onChange={(event) => updateProfileField('organizationName', event.target.value)}
                aria-invalid={Boolean(formErrors.organizationName)}
                placeholder="Open Hands School"
              />
              {formErrors.organizationName && <span className="field-error">{formErrors.organizationName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="organizationType">Organization type</label>
              <select
                id="organizationType"
                className="form-input form-select"
                value={profile.organizationType}
                onChange={(event) => updateProfileField('organizationType', event.target.value)}
                aria-invalid={Boolean(formErrors.organizationType)}
              >
                <option value="school">School</option>
                <option value="NGO">NGO</option>
                <option value="company">Company</option>
                <option value="interpreter agency">Interpreter agency</option>
                <option value="other">Other</option>
              </select>
              {formErrors.organizationType && <span className="field-error">{formErrors.organizationType}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="contactPersonName">Contact person name</label>
              <input
                id="contactPersonName"
                className="form-input"
                type="text"
                value={profile.contactPersonName}
                onChange={(event) => updateProfileField('contactPersonName', event.target.value)}
                aria-invalid={Boolean(formErrors.contactPersonName)}
                placeholder="Jordan Lee"
              />
              {formErrors.contactPersonName && <span className="field-error">{formErrors.contactPersonName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="website">Website (optional)</label>
              <input
                id="website"
                className="form-input"
                type="url"
                value={profile.website}
                onChange={(event) => updateProfileField('website', event.target.value)}
                aria-invalid={Boolean(formErrors.website)}
                placeholder="https://example.org"
              />
              {formErrors.website && <span className="field-error">{formErrors.website}</span>}
            </div>
          </>
        )}

        <div className="form-field">
          <label htmlFor="email">{emailLabel}</label>
          <input
            id="email"
            className="form-input"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(formErrors.email)}
            placeholder={selectedType === 'organization' && mode === 'signup' ? 'hello@school.org' : 'you@example.com'}
          />
          {formErrors.email && <span className="field-error">{formErrors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input
              id="password"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              aria-invalid={Boolean(formErrors.password)}
              placeholder="At least 8 characters"
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {formErrors.password && <span className="field-error">{formErrors.password}</span>}
        </div>

        {error && <FormAlert tone="error">{error}</FormAlert>}

        <button className="button auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>
      </form>
    </AuthLayout>
  );
}

function HomePage() {
  const pathCards = [
    {
      number: '01',
      title: 'Start with a sign',
      text: 'Pick one meaningful sign at a time and build your confidence through repetition and reflection.',
      warm: false,
    },
    {
      number: '02',
      title: 'Build community',
      text: 'Share what you are learning, ask questions, and stay encouraged by people making the same journey.',
      warm: true,
    },
  ];

  return (
    <>
      <section className="section-wrap hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> Community learning</p>
          <h1>Learn sign language with <em>patience</em> and people who get it.</h1>
          <p className="hero-description">HandSpeak helps new ASL learners build steady practice, explore prompts, and connect with a welcoming community that values accessibility and conversation.</p>

          <div className="hero-actions">
            <Link className="button" to="/signup/individual">Create your account</Link>
            <Link className="text-link" to="/learn">Explore lessons <span aria-hidden="true">→</span></Link>
          </div>

          <div className="hero-note">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 1.5v6.5m0 0 4.5 4.5M8 8 3.5 12.5M8 1.5a6.5 6.5 0 1 1 0 13" /></svg>
            A kind place to practice, revisit lessons, and keep learning.
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-card art-card-back">
            <span>LEARN</span>
            <span>CONNECT</span>
            <span>PRACTICE</span>
          </div>
          <div className="art-card art-card-front">
            <span className="art-caption">ASL learning path</span>
            <svg className="connection-art" viewBox="0 0 260 210" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M38 132c-9-25 2-47 28-56l27 21 5-34c2-12 17-12 19 1l2 30 19-19c9-8 24-1 24 10l-1 17 30-17c13-7 22 3 16 16l-12 25c-6 13-19 21-34 21H96c-20 0-36-12-48-27Z" fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <span className="art-word">hello</span>
          </div>
          <div className="art-label"><span className="art-label-dot" /> Ready to begin</div>
        </div>
      </section>

      <section className="home-path">
        <div className="section-wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> How it works</p>
              <h2>Build a rhythm that feels doable.</h2>
            </div>
            <p>ASL is visual and contextual. Your practice is more valuable when it feels supportive, gradual, and human.</p>
          </div>

          <div className="path-grid">
            {pathCards.map((card) => (
              <article key={card.number} className={`path-card ${card.warm ? 'path-card-warm' : ''}`}>
                <div className="path-icon">
                  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 11.5 11.5 4m-6 0h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="path-number">{card.number}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span className="card-arrow" aria-hidden="true">→</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function LearnPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lessons')
      .then((response) => response.json())
      .then((data) => setLessons(data.lessons || []))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> Lesson library</p>
        <h1>Small prompts, steady progress.</h1>
        <p>Each lesson is designed to help you explore a sign, a concept, or a new way to practice.</p>
      </div>

      <div className="lesson-note">
        <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1.5v10m0 0L3.5 12m4.5-4.5 4.5 4.5" /></svg>
        <p><strong>Note:</strong> ASL is visual and varies across communities. These lesson prompts are meant to support practice and conversation, not replace direct instruction from a Deaf ASL educator.</p>
      </div>

      {loading ? (
        <div className="app-loading" role="status">Loading lessons…</div>
      ) : (
        <div className="lesson-grid">
          {lessons.map((lesson, index) => (
            <article key={lesson.slug} className={`lesson-card lesson-tone-${index % 3}`}>
              <div className="lesson-visual">
                <span>{lesson.slug}</span>
                <div className="lesson-orbit">{lesson.title.slice(0, 2).toUpperCase()}</div>
              </div>
              <div style={{ padding: '24px 22px 19px' }}>
                <p className="eyebrow" style={{ marginBottom: '10px' }}><span className="eyebrow-line" /> {lesson.category || 'Practice'}</p>
                <h3 style={{ marginBottom: '9px', fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '-.05em' }}>{lesson.title}</h3>
                <p style={{ color: 'var(--neutral-600)', lineHeight: '1.7', marginBottom: '18px' }}>{lesson.summary}</p>
                <Link className="text-link lesson-cta" to={`/learn/${lesson.slug}`}>Open prompt <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonPage() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lessons/${slug}`)
      .then((response) => response.json())
      .then((data) => setLesson(data.lesson))
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="app-loading" role="status">Loading lesson…</div>;
  if (!lesson) return <NotFoundPage />;

  return (
    <div className="page-wrap">
      <div className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> Lesson prompt</p>
        <h1>{lesson.title}</h1>
        <p>{lesson.summary}</p>
      </div>

      <article className="detail-panel" style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-small)', background: 'var(--neutral-0)', padding: '28px 24px' }}>
        <p style={{ color: 'var(--neutral-600)', lineHeight: '1.8', marginBottom: 0 }}>{lesson.prompt}</p>
      </article>
    </div>
  );
}

function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadPosts() {
    try {
      const response = await fetch('/api/community');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch {
      setError('Unable to load the community feed right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      setError('Please sign in to post to the community.');
      return;
    }

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not post.');
      setMessage('');
      setError('');
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-wrap community-wrap">
      <div className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> Community</p>
        <h1>Share what you are learning.</h1>
        <p>Keep the conversation kind, curious, and consistent.</p>
      </div>

      {user && (
        <form className="post-composer" onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '18px 20px', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-small)', background: 'var(--neutral-0)' }}>
          <label htmlFor="post-message" style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>New post</label>
          <textarea id="post-message" value={message} onChange={(event) => setMessage(event.target.value)} rows="3" maxLength="500" style={{ width: '100%', resize: 'vertical', padding: '12px', borderRadius: '8px', border: '1px solid #cfcec4' }} placeholder="Share a question, practice win, or community encouragement." />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ color: 'var(--neutral-600)', fontSize: '.8rem' }}>{message.length}/500</span>
            <button className="button button-small" type="submit">Post</button>
          </div>
          {error && <div className="form-alert form-alert-error" style={{ marginTop: '12px' }}>{error}</div>}
        </form>
      )}

      {loading ? (
        <div className="app-loading" role="status">Loading community…</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {posts.map((post) => (
            <article key={post._id} style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-small)', background: 'var(--neutral-0)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <strong>{post.author?.name || 'HandSpeak member'}</strong>
                <span style={{ color: 'var(--neutral-600)', fontSize: '.78rem' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--neutral-800)' }}>{post.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { accountType } = useParams();

  if (!user || user.accountType !== accountType) {
    return <Navigate to="/login" replace />;
  }

  const title = user.accountType === 'individual'
    ? `One step at a time, ${user.profile.fullName.split(' ')[0]}.`
    : `Good to have you here, ${user.profile.organizationName}.`;

  const intro = user.accountType === 'individual'
    ? 'Your HandSpeak account is ready. Choose a lesson and keep building your ASL practice.'
    : 'Your organization account is ready. More team tools and community resources are on the way.';

  return (
    <main className="page-wrap dashboard-wrap">
      <p className="eyebrow"><span className="eyebrow-line" /> {user.accountType === 'individual' ? 'YOUR LEARNING SPACE' : 'ORGANIZATION SPACE'}</p>
      <h1>{title}</h1>
      <p className="dashboard-intro">{intro}</p>
      <Link className="button" to={user.accountType === 'individual' ? '/learn' : '/community'}>
        {user.accountType === 'individual' ? 'Explore your lessons' : 'Visit the community'} <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}

function NotFoundPage() {
  return (
    <div className="page-wrap not-found">
      <p className="eyebrow"><span className="eyebrow-line" /> Page not found</p>
      <h1>That page is not here.</h1>
      <Link className="button" to="/">Back home</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
