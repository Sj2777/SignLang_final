import { useState, useEffect, useRef, useMemo } from 'react';
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

// Core authentic Indian Sign Language word dataset
const ISL_WORD_SIGNS = {
  HELLO: { word: 'HELLO', marathi: 'नमस्कार', phonetic: 'Namaskar', image: '/assets/signs/words/hello.svg' },
  NAMASTE: { word: 'NAMASTE', marathi: 'नमस्कार', phonetic: 'Namaskar', image: '/assets/signs/words/hello.svg' },
  NAMASKAR: { word: 'NAMASKAR', marathi: 'नमस्कार', phonetic: 'Namaskar', image: '/assets/signs/words/hello.svg' },
  HELP: { word: 'HELP', marathi: 'मदत', phonetic: 'Madat', image: '/assets/signs/words/help.svg' },
  MADAT: { word: 'HELP', marathi: 'मदत', phonetic: 'Madat', image: '/assets/signs/words/help.svg' },
  WATER: { word: 'WATER', marathi: 'पाणी', phonetic: 'Paani', image: '/assets/signs/words/water.svg' },
  PANI: { word: 'WATER', marathi: 'पाणी', phonetic: 'Paani', image: '/assets/signs/words/water.svg' },
  FOOD: { word: 'FOOD', marathi: 'जेवण', phonetic: 'Jevan', image: '/assets/signs/words/food.svg' },
  MEAL: { word: 'FOOD', marathi: 'जेवण', phonetic: 'Jevan', image: '/assets/signs/words/food.svg' },
  JEVAN: { word: 'FOOD', marathi: 'जेवण', phonetic: 'Jevan', image: '/assets/signs/words/food.svg' },
  HOSPITAL: { word: 'HOSPITAL', marathi: 'दवाखाना', phonetic: 'Dawakhana', image: '/assets/signs/words/hospital.svg' },
  DAWAKHANA: { word: 'HOSPITAL', marathi: 'दवाखाना', phonetic: 'Dawakhana', image: '/assets/signs/words/hospital.svg' },
  POLICE: { word: 'POLICE', marathi: 'पोलीस', phonetic: 'Police', image: '/assets/signs/words/police.svg' },
  DOCTOR: { word: 'DOCTOR', marathi: 'डॉक्टर', phonetic: 'Doctor', image: '/assets/signs/words/doctor.svg' },
  PUNE: { word: 'PUNE', marathi: 'पुणे', phonetic: 'Pune', image: '/assets/signs/words/pune.svg' },
  THANK: { word: 'THANK YOU', marathi: 'धन्यवाद', phonetic: 'Dhanyawaad', image: '/assets/signs/words/thankyou.svg' },
  THANKS: { word: 'THANK YOU', marathi: 'धन्यवाद', phonetic: 'Dhanyawaad', image: '/assets/signs/words/thankyou.svg' },
  WELCOME: { word: 'WELCOME', marathi: 'स्वागत', phonetic: 'Swaagat', image: '/assets/signs/words/welcome.svg' },
  PLEASE: { word: 'PLEASE', marathi: 'कृपया', phonetic: 'Krupaya', image: '/assets/signs/words/please.svg' },
  YES: { word: 'YES', marathi: 'हो', phonetic: 'Ho', image: '/assets/signs/words/yes.svg' },
  NO: { word: 'NO', marathi: 'नाही', phonetic: 'Naahi', image: '/assets/signs/words/no.svg' },
  SCHOOL: { word: 'SCHOOL', marathi: 'शाळा', phonetic: 'Shaala', image: '/assets/signs/words/school.svg' },
  SHALA: { word: 'SCHOOL', marathi: 'शाळा', phonetic: 'Shaala', image: '/assets/signs/words/school.svg' },
  TIME: { word: 'TIME', marathi: 'वेळ', phonetic: 'Vel', image: '/assets/signs/words/time.svg' },
  VEL: { word: 'TIME', marathi: 'वेळ', phonetic: 'Vel', image: '/assets/signs/words/time.svg' },
  FRIEND: { word: 'FRIEND', marathi: 'मित्र', phonetic: 'Mitra', image: '/assets/signs/words/friend.svg' },
  MITRA: { word: 'FRIEND', marathi: 'मित्र', phonetic: 'Mitra', image: '/assets/signs/words/friend.svg' },
  GOOD: { word: 'GOOD', marathi: 'चांगले', phonetic: 'Chaangle', image: '/assets/signs/words/good.svg' },
  HOME: { word: 'HOME', marathi: 'घर', phonetic: 'Ghar', image: '/assets/signs/words/home.svg' },
  GHAR: { word: 'HOME', marathi: 'घर', phonetic: 'Ghar', image: '/assets/signs/words/home.svg' },
  NAME: { word: 'NAME', marathi: 'नाव', phonetic: 'Naav', image: '/assets/signs/words/name.svg' },
  NAV: { word: 'NAME', marathi: 'नाव', phonetic: 'Naav', image: '/assets/signs/words/name.svg' },
  TEA: { word: 'TEA', marathi: 'चहा', phonetic: 'Chaha', image: '/assets/signs/words/tea.svg' },
  CHAHA: { word: 'TEA', marathi: 'चहा', phonetic: 'Chaha', image: '/assets/signs/words/tea.svg' }
};

export default function ReverseTranslatePage() {
  const [inputText, setInputText] = useState('Hello Pune');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [speed, setSpeed] = useState(700); // ms per sign
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const ribbonRef = useRef(null);
  const activeItemRef = useRef(null);

  // Extract intelligent sign tokens (authentic word signs, numeric digits, and fingerspelled names)
  const tokens = useMemo(() => {
    if (!inputText || !inputText.trim()) return [];

    let textNorm = inputText
      .replace(/thank\s+you/gi, 'THANK')
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .trim();

    if (!textNorm) return [];

    const rawWords = textNorm.split(/\s+/).filter(Boolean);
    const list = [];

    rawWords.forEach((rawWord, wordIdx) => {
      const upper = rawWord.toUpperCase();

      // 1. Direct ISL Word Sign match
      if (ISL_WORD_SIGNS[upper]) {
        const item = ISL_WORD_SIGNS[upper];
        list.push({
          id: `word_${upper}_${wordIdx}`,
          isWord: true,
          isSpace: false,
          char: item.word,
          image: item.image,
          marathi: item.marathi,
          phonetic: item.phonetic
        });
      } else if (/^\d+$/.test(upper)) {
        // 2. Pure Numeric Sequence (digits 0-9)
        upper.split('').forEach((d, dIdx) => {
          list.push({
            id: `num_${d}_${wordIdx}_${dIdx}`,
            isWord: false,
            isSpace: false,
            char: d,
            image: `/assets/signs/${d}.png`,
            marathi: MARATHI_LETTERS[d] || d,
            phonetic: d
          });
        });
      } else {
        // 3. Unrecognized word or personal name: fingerspell each letter
        upper.split('').forEach((ch, chIdx) => {
          if (ch >= 'A' && ch <= 'Z') {
            list.push({
              id: `letter_${ch}_${wordIdx}_${chIdx}`,
              isWord: false,
              isSpace: false,
              char: ch,
              image: `/assets/signs/${ch.toLowerCase()}.png`,
              marathi: MARATHI_LETTERS[ch] || ch,
              phonetic: ch
            });
          } else if (ch >= '0' && ch <= '9') {
            list.push({
              id: `num_${ch}_${wordIdx}_${chIdx}`,
              isWord: false,
              isSpace: false,
              char: ch,
              image: `/assets/signs/${ch}.png`,
              marathi: MARATHI_LETTERS[ch] || ch,
              phonetic: ch
            });
          }
        });
      }

      // Add a natural pause between words
      if (wordIdx < rawWords.length - 1) {
        list.push({
          id: `space_${wordIdx}`,
          isWord: false,
          isSpace: true,
          char: 'SPACE',
          display: '␣'
        });
      }
    });

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
    <div className={styles.container}>
      {/* Compact Header Bar */}
      <header className={styles.topBar}>
        <div>
          <h1 className={styles.title}>
            Text to <span className={styles.titleAccent}>ISL Sign Language</span>
          </h1>
          <p className={styles.subtitle}>
            Translates vocabulary words directly into authentic ISL signs, with fingerspelling for personal names.
          </p>
        </div>
      </header>

      {/* Screen-Fitted 2-Column Workspace */}
      <div className={styles.workspace}>
        {/* Left: Input Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Input Text</span>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                onClick={toggleSpeech}
                title="Speak into microphone"
              >
                {isListening ? '🎙 Listening...' : '🎤 Speak'}
              </button>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => { setInputText(''); handleStop(); }}
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            className={styles.textArea}
            placeholder="Type words, phrases, or numbers (e.g., Hello Pune, Water, Help, Hospital 108)..."
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
                <button type="button" className={styles.pauseBtn} onClick={handlePause}>
                  ⏸ Pause
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.playBtn}
                  onClick={handlePlay}
                  disabled={tokens.length === 0}
                >
                  ▶ Play Signs
                </button>
              )}
              <button
                type="button"
                className={styles.stopBtn}
                onClick={handleStop}
                disabled={tokens.length === 0}
              >
                ⏹ Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sign Animation Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={styles.cardTitle}>Sign Display</span>
              {currentToken && currentToken.isWord && (
                <span className={styles.wordBadge}>ISL WORD SIGN</span>
              )}
            </div>
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
                  className={currentToken.isWord ? styles.wordSignImg : styles.signImg}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {!currentToken.isWord && (
                  <div className={styles.signLabelBlock}>
                    <span className={styles.signChar}>{currentToken.char}</span>
                    <span className={styles.signMarathi}>{currentToken.marathi}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clean Sequence Ribbon */}
          <div className={styles.ribbonWrapper}>
            <div className={styles.ribbonContainer} ref={ribbonRef}>
              {tokens.map((token, idx) => {
                const isActive = idx === currentSignIndex;
                return (
                  <button
                    type="button"
                    key={token.id}
                    ref={isActive ? activeItemRef : null}
                    className={`${styles.ribbonTile} ${isActive ? styles.ribbonActive : ''} ${
                      token.isWord ? styles.ribbonWordTile : token.isSpace ? styles.ribbonSpace : ''
                    }`}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentSignIndex(idx);
                    }}
                  >
                    {token.isSpace ? '␣' : token.isWord ? `[${token.char}]` : token.char}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
