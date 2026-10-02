import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { request } from './api.js';
import { Icon } from './icons.jsx';
import Button from './components/Button.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { AccountChooser, AuthFormPage } from './pages/AuthPages.jsx';
import { IndividualDashboard, OrganizationDashboard } from './pages/Dashboards.jsx';

function Header({ user, onSignOut }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="HandSpeak home"><span className="wordmark-mark">h</span>HandSpeak</Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/learn">Learn</NavLink>
          <NavLink to="/community">Community</NavLink>
        </nav>
        <div className="header-action">
          {user ? (
            <>
              <span className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="outline" size="small" onClick={onSignOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link className="sign-in-link" to="/login">Sign in</Link>
              <Link className="button button-small" to="/signup/individual">Join us <Icon name="arrow" size={16} /></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <main>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A place to learn, at your pace</p>
          <h1>More than words.<br /><em>A way to connect.</em></h1>
          <p className="hero-description">Start learning American Sign Language, find your rhythm, and practice with people who are learning right alongside you.</p>
          <div className="hero-actions">
            <Link className="button" to="/learn">Explore the lessons <Icon name="arrow" /></Link>
            <Link className="text-link" to="/community">Meet the community <Icon name="arrow" size={17} /></Link>
          </div>
          <p className="hero-note"><Icon name="spark" size={17} /> Small steps count. Start wherever you are.</p>
        </div>
        <div className="hero-art" aria-label="A visual reminder that communication brings people together" role="img">
          <div className="art-sun" />
          <div className="art-card art-card-back"><span>LISTEN</span><span>LEARN</span><span>CONNECT</span></div>
          <div className="art-card art-card-front">
            <span className="art-caption">A language made visible</span>
            <svg className="connection-art" viewBox="0 0 290 240" fill="none" aria-hidden="true">
              <path d="M57 163c18-45 48-74 88-74 36 0 65 20 87 54" stroke="currentColor" strokeWidth="2" strokeDasharray="3 7" />
              <path d="M57 163c-9-21-6-43 8-58 12-13 27-16 38-8l21 16 5-51c1-10 9-16 18-15 10 1 15 9 14 18l-3 37 5-9c5-8 15-10 22-5 6 4 8 12 5 19l-4 8c6-7 16-7 22-1 5 5 6 12 2 18 10-5 20 3 17 14l-12 41c-8 27-32 45-61 45h-19c-37 0-68-27-78-69Z" fill="#D9A878" stroke="#34483E" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="m151 94 7-10m24 21 8-10m18 24 9-7" stroke="#34483E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="63" cy="56" r="4" fill="#C7704D" /><circle cx="233" cy="71" r="5" fill="#C7704D" /><path d="M231 44v9m-4-4h9" stroke="#C7704D" strokeWidth="2" strokeLinecap="round" />
              <path d="M48 202c29 14 53 19 86 17" stroke="#5A6E5E" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="art-word">hello</span>
          </div>
          <div className="art-label"><span className="art-label-dot" /> LEARNING IN GOOD COMPANY</div>
        </div>
      </section>
      <section className="home-path section-wrap">
        <div className="section-heading">
          <div><p className="eyebrow">A good place to begin</p><h2>Make room for a new language.</h2></div>
          <p>Build a practice that feels like yours.<br />No rush, no perfect starting point.</p>
        </div>
        <div className="path-grid">
          <Link to="/learn" className="path-card">
            <span className="path-icon"><Icon name="book" size={23} /></span>
            <span className="path-number">01 / LEARN</span>
            <h3>Take it one lesson at a time.</h3>
            <p>Begin with introductions, fingerspelling, and the everyday phrases that open a conversation.</p>
            <span className="card-arrow"><Icon name="arrow" /></span>
          </Link>
          <Link to="/community" className="path-card path-card-warm">
            <span className="path-icon"><Icon name="people" size={23} /></span>
            <span className="path-number">02 / SHARE</span>
            <h3>Practice is better together.</h3>
            <p>Ask a question, share a small win, or simply see what other learners are working on.</p>
            <span className="card-arrow"><Icon name="arrow" /></span>
          </Link>
        </div>
        <p className="language-note">ASL is a rich, complete language with its own grammar and regional variation. These written prompts are a starting point—not a replacement for visual instruction or learning from Deaf people.</p>
      </section>
    </main>
  );
}

function Learn() {
  const [lessons, setLessons] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    request('/lessons')
      .then((data) => { setLessons(data.lessons); setStatus('ready'); })
      .catch((err) => { setError(err.message); setStatus('error'); });
  }, []);

  return (
    <main className="page-wrap">
      <div className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> YOUR LEARNING PATH</p>
        <h1>Start with a hello.</h1>
        <p>Short, thoughtful starting points for learning ASL. Choose a topic that feels useful today.</p>
      </div>
      <div className="lesson-note"><Icon name="spark" size={19} /><p><strong>Learn with your eyes, too.</strong> Sign language is visual. Pair these prompts with demonstrations from Deaf educators and notice how movement, space, and expression work together.</p></div>
      {status === 'loading' && <p className="notice" role="status">Gathering your lessons…</p>}
      {status === 'error' && <p className="notice error-text" role="alert">{error}</p>}
      {status === 'ready' && (
        <div className="lesson-grid">
          {lessons.map((lesson, index) => (
            <Link className={`lesson-card lesson-tone-${index % 4}`} to={`/learn/${lesson.slug}`} key={lesson.slug}>
              <div className="lesson-visual" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><div className="lesson-orbit">{lesson.symbol}</div></div>
              <div className="lesson-meta"><span>{lesson.category}</span><span>{lesson.duration}</span></div>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
              <span className="lesson-cta">Open lesson <Icon name="arrow" size={17} /></span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function LessonDetail() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    request(`/lessons/${slug}`)
      .then((data) => setLesson(data.lesson))
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <main className="page-wrap"><p className="notice error-text" role="alert">{error}</p><Link className="text-link" to="/learn">Back to lessons</Link></main>;
  if (!lesson) return <main className="page-wrap"><p className="notice" role="status">Loading lesson…</p></main>;

  return (
    <main className="page-wrap detail-wrap">
      <Link className="back-link" to="/learn">← All lessons</Link>
      <p className="eyebrow">{lesson.category} · {lesson.duration}</p>
      <h1>{lesson.title}</h1>
      <p className="detail-lead">{lesson.summary}</p>
      <section className="detail-panel">
        <h2>What you’ll explore</h2>
        <ul className="practice-list">{lesson.points.map((point) => <li key={point}><span className="list-mark" aria-hidden="true" />{point}</li>)}</ul>
      </section>
      <section className="detail-panel practice-panel">
        <span className="path-number">A SMALL PRACTICE</span>
        <h2>{lesson.practiceTitle}</h2>
        <p>{lesson.practice}</p>
      </section>
      <p className="language-note">Written prompts can’t show the full movement, facial grammar, or nuance of a sign. Seek visual instruction from Deaf ASL educators, and remember that signs can vary by region.</p>
    </main>
  );
}

function Community({ user }) {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  async function loadPosts() {
    setStatus('loading');
    setError('');
    try {
      const data = await request('/community');
      setPosts(data.posts);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  useEffect(() => { loadPosts(); }, []);

  async function submitPost(event) {
    event.preventDefault();
    setError('');
    setPosting(true);
    try {
      const data = await request('/community', { method: 'POST', body: JSON.stringify({ message }) });
      setPosts((current) => [data.post, ...current]);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="page-wrap community-wrap">
      <div className="page-intro community-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> THE COMMON ROOM</p>
        <h1>Learning happens<br />between us.</h1>
        <p>A kind corner of the internet for questions, practice, and the little things you’re proud of.</p>
      </div>
      <div className="community-layout">
        <section className="feed-column" aria-label="Community posts">
          {user ? (
            <form className="post-composer" onSubmit={submitPost}>
              <label htmlFor="post-message">What’s on your mind, {user.name.split(' ')[0]}?</label>
              <textarea id="post-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder="Share a question, a practice win, or something you learned…" required />
              <div className="composer-footer"><span>{message.length}/500</span><button className="button button-small" disabled={posting || !message.trim()}>{posting ? 'Sharing…' : 'Share with the community'} <Icon name="arrow" size={16} /></button></div>
            </form>
          ) : (
            <div className="join-prompt"><Icon name="message" /><p><strong>Have a question or a small win?</strong><br />Sign in to add your voice to the conversation.</p><Link className="text-link" to="/login">Sign in <Icon name="arrow" size={16} /></Link></div>
          )}
          {error && <p className="error-text" role="alert">{error}</p>}
          {status === 'loading' && <p className="notice" role="status">Loading the conversation…</p>}
          {status === 'error' && <button className="text-link" onClick={loadPosts}>Try loading posts again <Icon name="arrow" size={16} /></button>}
          {status === 'ready' && (posts.length ? posts.map((post) => (
            <article className="post-card" key={post._id}>
              <div className="post-avatar" aria-hidden="true">{post.author.name.trim().charAt(0).toUpperCase()}</div>
              <div className="post-content"><div className="post-byline"><strong>{post.author.name}</strong><time dateTime={post.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(post.createdAt))}</time></div><p>{post.message}</p></div>
            </article>
          )) : <div className="empty-feed"><Icon name="people" size={29} /><h2>The first hello is yours.</h2><p>There aren’t any posts yet. Start a conversation or come back soon.</p></div>)}
        </section>
        <aside className="community-aside">
          <span className="path-number">A NOTE ON THIS SPACE</span>
          <h2>Curious is welcome here.</h2>
          <p>Be generous with one another. Share what you’re learning, ask thoughtful questions, and leave room for the lived experiences of Deaf people.</p>
          <div className="aside-rule" />
          <p className="aside-small">This is a learner space—not a substitute for Deaf-led ASL instruction.</p>
        </aside>
      </div>
    </main>
  );
}

function NotFound() {
  return <main className="page-wrap not-found"><p className="eyebrow">THAT PAGE ISN’T HERE</p><h1>Let’s find another way.</h1><Link className="button" to="/">Back to the beginning <Icon name="arrow" /></Link></main>;
}

export default function App() {
  const { user, isLoading, sessionError, refreshUser, signOut } = useAuth();

  if (isLoading) return <div className="app-loading" role="status">Getting things ready…</div>;

  async function retrySession() {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Could not refresh the current session:', error);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {sessionError && <div className="session-alert" role="alert"><span>We couldn’t check your sign-in status. Some features may be unavailable.</span><button onClick={retrySession}>Try again</button></div>}
      <Header user={user} onSignOut={() => signOut().catch((error) => console.error('Could not sign out:', error))} />
      <div id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<LessonDetail />} />
          <Route path="/community" element={<Community user={user} />} />
          <Route path="/login" element={<AccountChooser />} />
          <Route path="/login/individual" element={<AuthFormPage accountType="individual" mode="login" />} />
          <Route path="/login/organization" element={<AuthFormPage accountType="organization" mode="login" />} />
          <Route path="/signup/individual" element={<AuthFormPage accountType="individual" mode="signup" />} />
          <Route path="/signup/organization" element={<AuthFormPage accountType="organization" mode="signup" />} />
          <Route element={<ProtectedRoute accountType="individual" />}>
            <Route path="/dashboard/individual" element={<IndividualDashboard />} />
          </Route>
          <Route element={<ProtectedRoute accountType="organization" />}>
            <Route path="/dashboard/organization" element={<OrganizationDashboard />} />
          </Route>
          <Route path="/register" element={<Navigate to="/signup/individual" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <footer className="site-footer"><Link className="wordmark footer-wordmark" to="/"><span className="wordmark-mark">h</span>handspeak</Link><p>Learning a language. Making space for each other.</p><span>ASL learner community</span></footer>
    </>
  );
}
