import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import {
  buildSignSequence,
  convertToISLGrammar,
  ISL_SAMPLE_PHRASES,
} from '../../lib/islTranslationEngine';
import styles from './ReverseTranslatePage.module.css';

const getSignPlaceholder = (label, marathi = '', category = '') => {
  const badgeColor = category === 'emergency' ? '#EF4444' : category === 'greeting' ? '#10B981' : '#0D9488';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="340" viewBox="0 0 340 340">
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1E293B"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
    </defs>
    <rect width="340" height="340" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
    <circle cx="170" cy="115" r="56" fill="${badgeColor}" fill-opacity="0.15" stroke="${badgeColor}" stroke-width="2"/>
    <text x="170" y="125" fill="${badgeColor}" font-family="sans-serif" font-size="44" font-weight="700" text-anchor="middle">🤟</text>
    <text x="170" y="210" fill="#F8FAFC" font-family="sans-serif" font-size="30" font-weight="800" text-anchor="middle">${label}</text>
    <text x="170" y="250" fill="#94A3B8" font-family="sans-serif" font-size="20" font-weight="600" text-anchor="middle">${marathi}</text>
    <rect x="100" y="280" width="140" height="26" rx="13" fill="${badgeColor}" fill-opacity="0.2"/>
    <text x="170" y="297" fill="${badgeColor}" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle">ISL WORD SIGN</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export default function ReverseTranslatePage() {
  const [inputText, setInputText] = useState('Hello Pune');
  const [mode, setMode] = useState('grammar'); // 'grammar' | 'fingerspell'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [speed, setSpeed] = useState(750); // ms per sign
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const ribbonRef = useRef(null);
  const activeItemRef = useRef(null);

  // Compute tokens dynamically from input
  const tokens = useMemo(() => {
    return buildSignSequence(inputText, mode);
  }, [inputText, mode]);

  const islGloss = useMemo(() => {
    if (mode === 'fingerspell') return inputText.toUpperCase();
    const words = convertToISLGrammar(inputText);
    return words.join(' ');
  }, [inputText, mode]);

  // Setup Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText((prev) => (prev ? `${prev.trim()} ` : '') + finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error:', err);
      }
    }
  };

  // Playback timer with proper completion handling
  useEffect(() => {
    let timer;
    if (isPlaying && tokens.length > 0) {
      if (currentSignIndex >= tokens.length - 1) {
        // Last sign reached: keep it on display for full duration before stopping
        timer = setTimeout(() => {
          setIsPlaying(false);
        }, speed);
      } else {
        timer = setTimeout(() => {
          setCurrentSignIndex((prev) => prev + 1);
        }, speed);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentSignIndex, tokens.length, speed]);

  // Keep active ribbon item scrolled into view
  useEffect(() => {
    if (activeItemRef.current && ribbonRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentSignIndex]);

  const handlePlay = () => {
    if (tokens.length === 0) return;
    if (currentSignIndex >= tokens.length - 1) {
      setCurrentSignIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSignIndex(0);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentSignIndex((prev) => Math.min(tokens.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentSignIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSelectSample = (text) => {
    setInputText(text);
    setCurrentSignIndex(0);
    setIsPlaying(true);
  };

  const clearText = () => {
    setInputText('');
    handleStop();
  };

  const speakText = (text, lang = 'mr-IN') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const currentToken = tokens[currentSignIndex] || null;

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className="container">
          {/* Header */}
          <div className={styles.headerSection}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Language to ISL Grammar Translation Engine
            </div>
            <h1 className={styles.title}>
              Text/Speech to <span className={styles.titleAccent}>ISL Sign Language</span>
            </h1>
            <p className={styles.subtitle}>
              Translate spoken or typed English into authentic Indian Sign Language (ISL) grammar (SOV) with high-res signs, Pune vocabulary, and 0-9 digits.
            </p>
          </div>

          {/* Quick Dataset Samples */}
          <div className={styles.sampleSection}>
            <span className={styles.sampleLabel}>
              📚 <strong>ISLTranslate Dataset</strong> Quick Phrases:
            </span>
            <div className={styles.sampleChips}>
              {ISL_SAMPLE_PHRASES.map((sample, idx) => (
                <button
                  key={idx}
                  className={styles.sampleChip}
                  onClick={() => handleSelectSample(sample.text)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.workspace}>
            {/* ── Left Column: Input & Grammar ── */}
            <div className={styles.inputCard}>
              <div className={styles.inputHeader}>
                <div className={styles.cardHeadingGroup}>
                  <h2>Natural Language Input</h2>
                  <span className={styles.tokenCountBadge}>{tokens.length} Sign Tokens</span>
                </div>
                <div className={styles.actions}>
                  <button
                    className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                    onClick={toggleSpeechRecognition}
                    title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
                    disabled={!speechSupported}
                  >
                    {isListening ? '🎙 Listening...' : '🎤 Speak'}
                  </button>
                  <button className={styles.clearBtn} onClick={clearText} title="Clear text">
                    Clear
                  </button>
                </div>
              </div>

              {/* Translation Mode Selector */}
              <div className={styles.modeToggleGroup}>
                <button
                  className={`${styles.modeBtn} ${mode === 'grammar' ? styles.modeBtnActive : ''}`}
                  onClick={() => { setMode('grammar'); setCurrentSignIndex(0); }}
                >
                  ✨ ISL Grammar & Words (SOV)
                </button>
                <button
                  className={`${styles.modeBtn} ${mode === 'fingerspell' ? styles.modeBtnActive : ''}`}
                  onClick={() => { setMode('fingerspell'); setCurrentSignIndex(0); }}
                >
                  🔤 Direct Fingerspelling
                </button>
              </div>

              <textarea
                className={styles.textArea}
                placeholder="Type any English phrase or speak (e.g., Hello Pune, Where is hospital, 1 2 3 4)..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setCurrentSignIndex(0);
                }}
              />

              {/* Grammar Translation Inspector */}
              <div className={styles.grammarInspector}>
                <div className={styles.grammarHeader}>
                  <span>ISL Grammatical Gloss (SOV Structure)</span>
                  <span className={styles.grammarBadge}>
                    {mode === 'grammar' ? 'ISL Syntax Applied' : 'Character Sequence'}
                  </span>
                </div>
                <div className={styles.grammarGloss}>
                  {islGloss || <span className={styles.glossPlaceholder}>Type text above to view ISL structure...</span>}
                </div>
              </div>

              {/* Playback Controls */}
              <div className={styles.controlsRow}>
                <div className={styles.speedControl}>
                  <label>Pacing:</label>
                  <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={1200}>Slow (1.2s)</option>
                    <option value={750}>Normal (0.75s)</option>
                    <option value={400}>Fast (0.4s)</option>
                  </select>
                </div>

                <div className={styles.playbackButtons}>
                  <button
                    className={styles.navBtn}
                    onClick={handlePrev}
                    disabled={currentSignIndex <= 0 || tokens.length === 0}
                    title="Previous sign"
                  >
                    ⏮
                  </button>

                  {isPlaying ? (
                    <button className={styles.pauseBtn} onClick={handlePause} title="Pause playback">
                      ⏸ Pause
                    </button>
                  ) : (
                    <button
                      className={styles.playBtn}
                      onClick={handlePlay}
                      disabled={tokens.length === 0}
                      title="Play ISL animation sequence"
                    >
                      ▶ Play Signs
                    </button>
                  )}

                  <button
                    className={styles.navBtn}
                    onClick={handleNext}
                    disabled={currentSignIndex >= tokens.length - 1 || tokens.length === 0}
                    title="Next sign"
                  >
                    ⏭
                  </button>

                  <button
                    className={styles.stopBtn}
                    onClick={handleStop}
                    disabled={tokens.length === 0}
                    title="Reset to beginning"
                  >
                    ⏹ Reset
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right Column: Sign Visualization Window ── */}
            <div className={styles.displayCard}>
              <div className={styles.displayHeader}>
                <h2>ISL Sign Display</h2>
                <span className={styles.stepCounter}>
                  {tokens.length > 0
                    ? `Sign ${currentSignIndex + 1} of ${tokens.length}`
                    : 'Awaiting Input'}
                </span>
              </div>

              <div className={styles.animationWindow}>
                {tokens.length === 0 ? (
                  <div className={styles.placeholder}>
                    Type or speak in the box to view Indian Sign Language
                  </div>
                ) : !currentToken ? (
                  <div className={styles.placeholder}>Press Play to start</div>
                ) : currentToken.type === 'space' ? (
                  <div className={styles.spaceContainer}>
                    <div className={styles.spaceBox}>[ WORD PAUSE ]</div>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                      Natural pause between ISL concepts
                    </p>
                  </div>
                ) : currentToken.type === 'word' ? (
                  <div className={styles.wordSignCard}>
                    <div className={styles.wordBadgeHeader}>
                      <span className={styles.wordTypePill}>AUTHENTIC ISL WORD SIGN</span>
                      {currentToken.category && (
                        <span className={styles.categoryPill}>{currentToken.category.toUpperCase()}</span>
                      )}
                    </div>

                    <div className={styles.wordSignIcon}>
                      <span className={styles.signHandEmoji}>🤲</span>
                    </div>

                    <div className={styles.wordMainTitle}>{currentToken.token}</div>
                    <div className={styles.wordMarathiScript}>{currentToken.marathi}</div>
                    <div className={styles.wordPhonetic}>[{currentToken.phonetic}]</div>

                    <button
                      className={styles.audioPronounceBtn}
                      onClick={() => speakText(`${currentToken.token}. ${currentToken.marathi}`)}
                      title="Pronounce sign"
                    >
                      🔊 Speak Pronunciation
                    </button>
                  </div>
                ) : (
                  <div className={styles.signDisplay}>
                    <img
                      src={currentToken.image}
                      alt={`ISL Sign for ${currentToken.token}`}
                      className={styles.signImage}
                      onError={(e) => {
                        if (e.currentTarget.dataset.fallback) return;
                        e.currentTarget.dataset.fallback = 'true';
                        e.currentTarget.src = getSignPlaceholder(
                          currentToken.display,
                          currentToken.marathi
                        );
                      }}
                    />

                    <div className={styles.signMetaStrip}>
                      <div className={styles.signLabel}>
                        {currentToken.type === 'number'
                          ? `Digit '${currentToken.token}'`
                          : `Letter '${currentToken.token}'`}
                      </div>

                      {currentToken.parentWord && (
                        <div className={styles.spellingContext}>
                          Spelling: <strong>{currentToken.parentWord}</strong> (Letter {currentToken.letterIndex + 1}/{currentToken.totalLetters})
                        </div>
                      )}

                      <div className={styles.marathiLabel}>
                        {currentToken.marathi} [{currentToken.phonetic}]
                      </div>

                      <button
                        className={styles.miniAudioBtn}
                        onClick={() => speakText(`${currentToken.token}. ${currentToken.marathi}`)}
                        title="Pronounce sign"
                      >
                        🔊 Pronounce
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sequence Ribbon Timeline */}
              <div className={styles.ribbonSection}>
                <div className={styles.ribbonHeader}>
                  <span>ISL Sequence Timeline (Click any sign to jump)</span>
                </div>
                <div className={styles.previewStrip} ref={ribbonRef}>
                  {tokens.map((token, idx) => {
                    const isActive = idx === currentSignIndex;
                    return (
                      <button
                        key={token.id || idx}
                        ref={isActive ? activeItemRef : null}
                        className={`${styles.previewItem} ${isActive ? styles.activePreview : ''} ${
                          token.type === 'word'
                            ? styles.wordPreview
                            : token.type === 'number'
                            ? styles.numberPreview
                            : token.type === 'space'
                            ? styles.spacePreview
                            : ''
                        }`}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentSignIndex(idx);
                        }}
                        title={`${token.display} - ${token.marathi || ''}`}
                      >
                        {token.type === 'space' ? '␣' : token.display}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
