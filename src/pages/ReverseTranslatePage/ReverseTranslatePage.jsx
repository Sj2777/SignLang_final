import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './ReverseTranslatePage.module.css';

const MARATHI_LETTERS = {
  A: 'ए', B: 'बी', C: 'सी', D: 'डी', E: 'ई', F: 'एफ', G: 'जी',
  H: 'एच', I: 'आय', J: 'जे', K: 'के', L: 'एल', M: 'एम', N: 'एन',
  O: 'ओ', P: 'पी', Q: 'क्यू', R: 'आर', S: 'एस', T: 'टी', U: 'यू',
  V: 'व्ही', W: 'डब्ल्यू', X: 'एक्स', Y: 'वाय', Z: 'झेड',
  '0': '० (शून्य)', '1': '१ (एक)', '2': '२ (दोन)', '3': '३ (तीन)',
  '4': '४ (चार)', '5': '५ (पाच)', '6': '६ (सहा)', '7': '७ (सात)',
  '8': '८ (आठ)', '9': '९ (नऊ)'
};

export default function ReverseTranslatePage() {
  const [inputText, setInputText] = useState('HELLO PUNE');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [speed, setSpeed] = useState(700); // ms per sign
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const ribbonRef = useRef(null);
  const activeItemRef = useRef(null);

  // Extract clean sign tokens (letters A-Z, numbers 0-9, and spaces)
  const tokens = useMemo(() => {
    if (!inputText || !inputText.trim()) return [];

    const cleaned = inputText.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
    const chars = cleaned.split('');
    const list = [];
    let lastWasSpace = true;

    chars.forEach((ch, idx) => {
      if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
        list.push({
          id: `${ch}_${idx}`,
          char: ch,
          isSpace: false,
          image: ch >= '0' && ch <= '9' 
            ? `/assets/signs/${ch}.png` 
            : `/assets/signs/${ch.toLowerCase()}.png`,
          marathi: MARATHI_LETTERS[ch] || ch
        });
        lastWasSpace = false;
      } else if (ch === ' ' || ch === '\n') {
        if (!lastWasSpace && list.length > 0) {
          list.push({
            id: `space_${idx}`,
            char: 'SPACE',
            isSpace: true,
            display: '␣'
          });
          lastWasSpace = true;
        }
      }
    });

    if (list.length > 0 && list[list.length - 1].isSpace) {
      list.pop();
    }
    return list;
  }, [inputText]);

  // Speech Recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const sr = new SpeechRecognition();
      sr.continuous = true;
      sr.interimResults = true;
      sr.lang = 'en-IN';

      sr.onresult = (event) => {
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

      sr.onerror = () => setIsListening(false);
      sr.onend = () => setIsListening(false);
      recognitionRef.current = sr;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
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
      } catch {
        setIsListening(false);
      }
    }
  };

  // Playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && tokens.length > 0) {
      if (currentSignIndex >= tokens.length - 1) {
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

  // Auto scroll active token in timeline
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

  const handlePause = () => setIsPlaying(false);

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSignIndex(0);
  };

  const currentToken = tokens[currentSignIndex] || null;

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className="container">
          {/* Spacious, Clean Header */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>
              Text to <span className={styles.titleAccent}>ISL Sign Language</span>
            </h1>
            <p className={styles.subtitle}>
              Type any word, sentence, or numbers to watch authentic Indian Sign Language hand gestures.
            </p>
          </div>

          {/* Spacious 2-Column Workspace */}
          <div className={styles.workspace}>
            {/* Left: Clean Input Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Input Text</h2>
                <div className={styles.headerActions}>
                  <button
                    className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                    onClick={toggleSpeech}
                    title="Speak into microphone"
                  >
                    {isListening ? '🎙 Listening...' : '🎤 Speak'}
                  </button>
                  <button
                    className={styles.clearBtn}
                    onClick={() => { setInputText(''); handleStop(); }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                className={styles.textArea}
                placeholder="Type words, names, or numbers (e.g., Hello Pune, Room 108)..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setCurrentSignIndex(0);
                }}
              />

              <div className={styles.controlsRow}>
                <div className={styles.speedWrapper}>
                  <label htmlFor="speed-select">Speed:</label>
                  <select
                    id="speed-select"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value={1000}>Slow (1.0s)</option>
                    <option value={700}>Normal (0.7s)</option>
                    <option value={400}>Fast (0.4s)</option>
                  </select>
                </div>

                <div className={styles.playActions}>
                  {isPlaying ? (
                    <button className={styles.pauseBtn} onClick={handlePause}>
                      ⏸ Pause
                    </button>
                  ) : (
                    <button
                      className={styles.playBtn}
                      onClick={handlePlay}
                      disabled={tokens.length === 0}
                    >
                      ▶ Play Signs
                    </button>
                  )}
                  <button
                    className={styles.stopBtn}
                    onClick={handleStop}
                    disabled={tokens.length === 0}
                  >
                    ⏹ Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Spacious Sign Animation Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Sign Display</h2>
                <span className={styles.counterBadge}>
                  {tokens.length > 0 ? `${currentSignIndex + 1} / ${tokens.length}` : '0 / 0'}
                </span>
              </div>

              <div className={styles.signWindow}>
                {tokens.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Type text or speak above to see ISL signs</p>
                  </div>
                ) : !currentToken ? (
                  <div className={styles.emptyState}>
                    <p>Press Play to begin</p>
                  </div>
                ) : currentToken.isSpace ? (
                  <div className={styles.spaceState}>
                    <span className={styles.spacePill}>[ WORD PAUSE ]</span>
                  </div>
                ) : (
                  <div className={styles.signFrame}>
                    <img
                      src={currentToken.image}
                      alt={`ISL Sign for ${currentToken.char}`}
                      className={styles.signImg}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className={styles.signLabelBlock}>
                      <span className={styles.signChar}>{currentToken.char}</span>
                      <span className={styles.signMarathi}>{currentToken.marathi}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Sequence Ribbon */}
              {tokens.length > 0 && (
                <div className={styles.ribbonContainer} ref={ribbonRef}>
                  {tokens.map((token, idx) => {
                    const isActive = idx === currentSignIndex;
                    return (
                      <button
                        key={token.id}
                        ref={isActive ? activeItemRef : null}
                        className={`${styles.ribbonTile} ${isActive ? styles.ribbonActive : ''} ${
                          token.isSpace ? styles.ribbonSpace : ''
                        }`}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentSignIndex(idx);
                        }}
                      >
                        {token.isSpace ? '␣' : token.char}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
