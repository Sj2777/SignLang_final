import { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './ReverseTranslatePage.module.css';

export default function ReverseTranslatePage() {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(-1);
  const [speed, setSpeed] = useState(800); // ms per sign
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);
  
  // Clean text and extract playable tokens (alphabets A-Z)
  // For now, we fallback to fingerspelling. Spaces will be null or special token.
  const getTokens = (text) => {
    return text.toUpperCase().split('').map(char => {
      if (char >= 'A' && char <= 'Z') return char;
      if (char === ' ') return 'SPACE';
      return null;
    }).filter(Boolean);
  };
  
  const tokens = getTokens(inputText);
  
  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Indian English
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript.trim());
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    let timer;
    if (isPlaying && tokens.length > 0) {
      if (currentSignIndex >= tokens.length) {
        setIsPlaying(false);
        setCurrentSignIndex(-1);
      } else {
        timer = setTimeout(() => {
          setCurrentSignIndex(prev => prev + 1);
        }, speed);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentSignIndex, tokens.length, speed]);

  const handlePlay = () => {
    if (tokens.length === 0) return;
    setCurrentSignIndex(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSignIndex(-1);
  };

  const clearText = () => {
    setInputText('');
    handleStop();
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.headerSection}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Reverse Translation
            </div>
            <h1 className={styles.title}>
              Text/Speech to <span className={styles.titleAccent}>ISL Sign</span>
            </h1>
            <p className={styles.subtitle}>
              Type English text or speak into the microphone to see it spelled out in Indian Sign Language.
            </p>
          </div>

          <div className={styles.workspace}>
            {/* Input Section */}
            <div className={styles.inputCard}>
              <div className={styles.inputHeader}>
                <h2>Input</h2>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                    onClick={toggleSpeechRecognition}
                    title="Toggle Speech to Text"
                  >
                    {isListening ? '🎙 Listening...' : '🎤 Speak'}
                  </button>
                  <button className={styles.clearBtn} onClick={clearText}>Clear</button>
                </div>
              </div>
              
              <textarea
                className={styles.textArea}
                placeholder="Type something here (e.g., Hello Pune) or use the microphone..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className={styles.controls}>
                <div className={styles.speedControl}>
                  <label>Speed:</label>
                  <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                    <option value={1200}>Slow</option>
                    <option value={800}>Normal</option>
                    <option value={400}>Fast</option>
                  </select>
                </div>
                
                {isPlaying ? (
                  <button className={styles.stopBtn} onClick={handleStop}>
                    ⏹ Stop
                  </button>
                ) : (
                  <button className={styles.playBtn} onClick={handlePlay} disabled={tokens.length === 0}>
                    ▶ Play Signs
                  </button>
                )}
              </div>
            </div>

            {/* Display Section */}
            <div className={styles.displayCard}>
              <h2>ISL Animation</h2>
              <div className={styles.animationWindow}>
                {currentSignIndex === -1 && !isPlaying ? (
                  <div className={styles.placeholder}>
                    {tokens.length > 0 ? "Press Play to start" : "Enter text to see signs"}
                  </div>
                ) : (
                  currentSignIndex < tokens.length && currentSignIndex >= 0 ? (
                    tokens[currentSignIndex] === 'SPACE' ? (
                      <div className={styles.spaceSign}>[ SPACE ]</div>
                    ) : (
                      <div className={styles.signDisplay}>
                        <img 
                          src={`/assets/signs/${tokens[currentSignIndex]}.jpg`} 
                          alt={`Sign for ${tokens[currentSignIndex]}`} 
                          className={styles.signImage}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=' + tokens[currentSignIndex]; }}
                        />
                        <div className={styles.signLabel}>{tokens[currentSignIndex]}</div>
                      </div>
                    )
                  ) : (
                    <div className={styles.placeholder}>Done!</div>
                  )
                )}
              </div>
              
              {/* Sequence preview strip */}
              <div className={styles.previewStrip}>
                {tokens.map((token, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.previewItem} ${idx === currentSignIndex ? styles.activePreview : ''}`}
                  >
                    {token === 'SPACE' ? '_' : token}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
