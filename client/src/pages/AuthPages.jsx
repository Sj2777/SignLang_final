import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { request } from '../api.js';
import { Icon } from '../icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';
import FormAlert from '../components/FormAlert.jsx';
import PasswordField from '../components/PasswordField.jsx';
import TextField from '../components/TextField.jsx';

const accountCopy = {
  individual: {
    name: 'individual',
    title: 'Learn one sign, one conversation at a time.',
    description: 'A welcoming place to build your ASL practice, meet other learners, and find your own pace.',
    loginHeading: 'Good to see you again.',
    loginIntro: 'Sign in to pick up your learning and stay close to the community.',
    signupHeading: 'Your learning starts here.',
    signupIntro: 'Create your learner account and make space for a new language.',
  },
  organization: {
    name: 'organization',
    title: 'Make more room for connection.',
    description: 'Bring your school, organization, or interpreting team into a community built around accessible communication.',
    loginHeading: 'Welcome back to your work.',
    loginIntro: 'Sign in to continue building more accessible conversations with your team.',
    signupHeading: 'Your work belongs here.',
    signupIntro: 'Create an organization account to connect your team with the ASL learning community.',
  },
};

function AccountIcon({ type }) {
  if (type === 'individual') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 39c1.8-8 6.6-12 14-12s12.2 4 14 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 12v-4h4M41 12V8h-4M7 36v4h4M41 36v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
      <path d="M8 40h32M12 40V18l12-8 12 8v22M19 40V28h10v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 21h.01M24 21h.01M30 21h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function AccountVisual({ type }) {
  return (
    <div className={`auth-account-visual auth-account-visual-${type}`} aria-hidden="true">
      <span className="auth-visual-ring auth-visual-ring-one" />
      <span className="auth-visual-ring auth-visual-ring-two" />
      <div className="auth-visual-stamp"><AccountIcon type={type} /></div>
      <span className="auth-visual-caption">{type === 'individual' ? 'LEARN AT YOUR PACE' : 'GROW TOGETHER'}</span>
    </div>
  );
}

function AccountChooser() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="app-loading" role="status">Checking your sign-in…</div>;
  if (user) return <Navigate to={`/dashboard/${user.accountType}`} replace />;

  return (
    <AuthLayout
      visualEyebrow="FIND YOUR PLACE"
      visualTitle="Every good conversation starts somewhere."
      visualDescription="Whether you’re learning on your own or creating more access at work, there’s a place for you here."
      visualContent={<AccountVisual type="individual" />}
      visualLabel="Illustration representing learners and community"
    >
      <p className="eyebrow">A COMMUNITY FOR CONNECTION</p>
      <h2 className="auth-page-heading">How are you joining us?</h2>
      <p className="auth-subtitle">Choose the account that best fits the way you’ll use HandSpeak.</p>
      <div className="account-choice-list">
        <Link className="account-choice account-choice-individual" to="/login/individual">
          <span className="account-choice-icon"><AccountIcon type="individual" /></span>
          <span className="account-choice-copy">
            <strong>I’m an individual</strong>
            <span>For learners building their own ASL practice.</span>
            <span className="account-choice-action">Continue as an individual <Icon name="arrow" size={17} /></span>
          </span>
        </Link>
        <Link className="account-choice account-choice-organization" to="/login/organization">
          <span className="account-choice-icon"><AccountIcon type="organization" /></span>
          <span className="account-choice-copy">
            <strong>I’m an organization</strong>
            <span>For schools, nonprofits, and teams making communication more accessible.</span>
            <span className="account-choice-action">Continue as an organization <Icon name="arrow" size={17} /></span>
          </span>
        </Link>
      </div>
      <p className="auth-switch">New to HandSpeak? <Link to="/signup/individual">Create an account</Link></p>
    </AuthLayout>
  );
}

function validateForm(type, mode, values) {
  const errors = {};
  if (mode === 'signup' && type === 'individual' && !values.fullName.trim()) {
    errors.fullName = 'Enter your full name.';
  }
  if (mode === 'signup' && type === 'organization') {
    if (!values.organizationName.trim()) errors.organizationName = 'Enter your organization name.';
    if (!values.organizationType) errors.organizationType = 'Choose an organization type.';
    if (!values.contactPersonName.trim()) errors.contactPersonName = 'Enter a contact person name.';
    if (values.website && !/^https?:\/\/\S+\.\S+/i.test(values.website)) {
      errors.website = 'Enter a full website address, including https://.';
    }
  }
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter an email address in the format name@example.com.';
  }
  if (!values.password) errors.password = 'Enter your password.';
  else if (mode === 'signup' && values.password.length < 8) {
    errors.password = 'Use at least 8 characters for your password.';
  }
  return errors;
}

function AuthFormPage({ accountType, mode }) {
  const type = accountType;
  const copy = accountCopy[type];
  const signup = mode === 'signup';
  const navigate = useNavigate();
  const { user, isLoading, setUser } = useAuth();
  const [values, setValues] = useState({
    fullName: '',
    organizationName: '',
    organizationType: '',
    contactPersonName: '',
    email: '',
    password: '',
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="app-loading" role="status">Checking your sign-in…</div>;
  if (user) return <Navigate to={`/dashboard/${user.accountType}`} replace />;

  function updateField(field, value) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field]) {
      setErrors((current) => ({
        ...current,
        [field]: validateForm(type, mode, next)[field],
      }));
    }
    setServerError('');
  }

  function handleBlur(field) {
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    const fieldError = validateForm(type, mode, values)[field];
    setErrors((current) => ({ ...current, [field]: fieldError }));
  }

  async function submit(event) {
    event.preventDefault();
    const allTouched = Object.fromEntries(
      Object.keys(values).map((field) => [field, true]),
    );
    setTouched(allTouched);
    const validationErrors = validateForm(type, mode, values);
    setErrors(validationErrors);
    setServerError('');
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const profile = type === 'individual'
        ? { fullName: values.fullName.trim() }
        : {
          organizationName: values.organizationName.trim(),
          organizationType: values.organizationType,
          contactPersonName: values.contactPersonName.trim(),
          ...(values.website.trim() ? { website: values.website.trim() } : {}),
        };
      const body = signup
        ? { email: values.email.trim(), password: values.password, profile }
        : { email: values.email.trim(), password: values.password };
      const response = await request(`/auth/${signup ? 'register' : 'login'}/${type}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setUser(response.user);
      navigate(`/dashboard/${response.user.accountType}`, { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const fields = type === 'individual'
    ? <TextField
      id="full-name"
      label="Full name"
      autoComplete="name"
      value={values.fullName}
      onChange={(event) => updateField('fullName', event.target.value)}
      onBlur={() => handleBlur('fullName')}
      error={errors.fullName}
      required
      maxLength={100}
    />
    : <>
      <TextField
        id="organization-name"
        label="Organization name"
        autoComplete="organization"
        value={values.organizationName}
        onChange={(event) => updateField('organizationName', event.target.value)}
        onBlur={() => handleBlur('organizationName')}
        error={errors.organizationName}
        required
        maxLength={120}
      />
      <div className="form-field">
        <label htmlFor="organization-type">Organization type</label>
        <select
          className="form-input form-select"
          id="organization-type"
          value={values.organizationType}
          onChange={(event) => updateField('organizationType', event.target.value)}
          onBlur={() => handleBlur('organizationType')}
          aria-invalid={errors.organizationType ? 'true' : undefined}
          aria-describedby={errors.organizationType ? 'organization-type-error' : undefined}
          required
        >
          <option value="">Choose a type</option>
          <option value="school">School</option>
          <option value="NGO">NGO</option>
          <option value="company">Company</option>
          <option value="interpreter agency">Interpreter agency</option>
          <option value="other">Other</option>
        </select>
        {errors.organizationType && <span className="field-error" id="organization-type-error">{errors.organizationType}</span>}
      </div>
      <TextField
        id="contact-person"
        label="Contact person name"
        autoComplete="name"
        value={values.contactPersonName}
        onChange={(event) => updateField('contactPersonName', event.target.value)}
        onBlur={() => handleBlur('contactPersonName')}
        error={errors.contactPersonName}
        required
        maxLength={100}
      />
    </>;

  return (
    <AuthLayout
      visualEyebrow={type === 'individual' ? 'YOUR ASL LEARNING SPACE' : 'ACCESSIBILITY STARTS TOGETHER'}
      visualTitle={copy.title}
      visualDescription={copy.description}
      visualContent={<AccountVisual type={type} />}
      visualLabel={`${copy.name} account illustration`}
    >
      <p className="eyebrow">{signup ? 'MAKE YOURSELF AT HOME' : type === 'individual' ? 'PICK UP YOUR PRACTICE' : 'WELCOME BACK, TEAM'}</p>
      <h2 className="auth-page-heading">
        {signup
          ? type === 'individual' ? copy.signupHeading : 'Create your organization account.'
          : copy.loginHeading}
      </h2>
      <p className="auth-subtitle">{signup ? copy.signupIntro : copy.loginIntro}</p>
      <form onSubmit={submit} className="auth-form" noValidate>
        {signup && fields}
        <TextField
          id="auth-email"
          label={type === 'organization' ? 'Work email' : 'Email address'}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          required
          maxLength={254}
        />
        <PasswordField
          id="auth-password"
          autoComplete={signup ? 'new-password' : 'current-password'}
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          hint={signup ? 'Use at least 8 characters.' : undefined}
          required
          minLength={signup ? 8 : undefined}
          maxLength={128}
        />
        {signup && type === 'organization' && (
          <TextField
            id="organization-website"
            label="Website (optional)"
            type="url"
            autoComplete="url"
            placeholder="https://example.org"
            value={values.website}
            onChange={(event) => updateField('website', event.target.value)}
            onBlur={() => handleBlur('website')}
            error={errors.website}
            maxLength={2048}
          />
        )}
        <FormAlert>{serverError}</FormAlert>
        <Button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'One moment…' : signup ? 'Create your account' : 'Sign in'} <Icon name="arrow" />
        </Button>
      </form>
      <p className="auth-switch">
        {signup ? 'Already have an account?' : type === 'individual' ? 'Signing in for an organization?' : 'Signing in as an individual?'}{' '}
        <Link to={signup ? `/login/${type}` : `/login/${type === 'individual' ? 'organization' : 'individual'}`}>
          {signup ? 'Sign in' : 'Switch account type'}
        </Link>
      </p>
      {signup && (
        <p className="auth-switch auth-switch-secondary">
          {type === 'individual' ? 'Joining on behalf of a team?' : 'Joining as an individual?'}{' '}
          <Link to={`/signup/${type === 'individual' ? 'organization' : 'individual'}`}>
            {type === 'individual' ? 'Create an organization account' : 'Create an individual account'}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

export { AccountChooser, AuthFormPage };
