import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './TranslatePage.module.css';

const API_BASE = 'http://127.0.0.1:8000';

const DEFAULT_LABELS = {
  "A": { "english": "A", "marathi": "ए", "phonetic": "Ae", "example_mr": "एक (One)" },
  "B": { "english": "B", "marathi": "बी", "phonetic": "B", "example_mr": "बस (Bus)" },
  "C": { "english": "C", "marathi": "सी", "phonetic": "C", "example_mr": "चंद्र (Moon)" },
  "D": { "english": "D", "marathi": "डी", "phonetic": "D", "example_mr": "दवाखाना (Hospital)" },
  "E": { "english": "E", "marathi": "ई", "phonetic": "Ee", "example_mr": "इमारत (Building)" },
  "F": { "english": "F", "marathi": "एफ", "phonetic": "F", "example_mr": "फूल (Flower)" },
  "G": { "english": "G", "marathi": "जी", "phonetic": "G", "example_mr": "गाव (Village)" },
  "H": { "english": "H", "marathi": "एच", "phonetic": "H", "example_mr": "हात (Hand)" },
  "I": { "english": "I", "marathi": "आय", "phonetic": "Aa-e", "example_mr": "आई (Mother)" },
  "J": { "english": "J", "marathi": "जे", "phonetic": "J", "example_mr": "जेवण (Meal)" },
  "K": { "english": "K", "marathi": "के", "phonetic": "K", "example_mr": "काम (Work)" },
  "L": { "english": "L", "marathi": "एल", "phonetic": "L", "example_mr": "लाल (Red)" },
  "M": { "english": "M", "marathi": "एम", "phonetic": "M", "example_mr": "मदत (Help)" },
  "N": { "english": "N", "marathi": "एन", "phonetic": "N", "example_mr": "नमस्कार (Namaskar)" },
  "O": { "english": "O", "marathi": "ओ", "phonetic": "O", "example_mr": "ओळख (Identity)" },
  "P": { "english": "P", "marathi": "पी", "phonetic": "P", "example_mr": "पुणे (Pune)" },
  "Q": { "english": "Q", "marathi": "क्यू", "phonetic": "Q", "example_mr": "रांग (Queue)" },
  "R": { "english": "R", "marathi": "आर", "phonetic": "R", "example_mr": "रिक्षा (Rickshaw)" },
  "S": { "english": "S", "marathi": "एस", "phonetic": "S", "example_mr": "शाळा (School)" },
  "T": { "english": "T", "marathi": "टी", "phonetic": "T", "example_mr": "तिकीट (Ticket)" },
  "U": { "english": "U", "marathi": "यू", "phonetic": "U", "example_mr": "उद्या (Tomorrow)" },
  "V": { "english": "V", "marathi": "व्ही", "phonetic": "V", "example_mr": "विचार (Thought)" },
  "W": { "english": "W", "marathi": "डब्ल्यू", "phonetic": "W", "example_mr": "वार (Day)" },
  "X": { "english": "X", "marathi": "एक्स", "phonetic": "X", "example_mr": "क्ष-किरण (X-Ray)" },
  "Y": { "english": "Y", "marathi": "वाय", "phonetic": "Y", "example_mr": "योग (Yoga)" },
  "Z": { "english": "Z", "marathi": "झेड", "phonetic": "Z", "example_mr": "झेंडा (Flag)" }
};

// 21 MediaPipe hand landmark skeletal connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                               // Palm base
];

export default function TranslatePage() {
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Word buffer for spelling words
  const [wordBuffer, setWordBuffer] = useState('');

  // Upload preview
  const [previewSrc, setPreviewSrc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoDetectRef = useRef(autoDetect);
  const isProcessingRef = useRef(false);

  autoDetectRef.current = autoDetect;
  isProcessingRef.current = isProcessing;

  // 1. Check Backend Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) {
        setBackendOnline(true);
        setErrorMsg('');
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // 2. Camera Controls
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      setErrorMsg('Unable to access camera. Please allow camera permissions in your browser.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 3. Draw Skeleton Overlay
  const drawSkeleton = useCallback((landmarksPoints) => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showSkeleton || !landmarksPoints || landmarksPoints.length === 0) return;

    landmarksPoints.forEach((hand) => {
      // Map normalized coordinates (0 to 1) to canvas pixels.
      // Mirror horizontally: (1 - x) to match mirrored video element
      const pts = hand.map(([x, y]) => ({
        x: (1 - x) * canvas.width,
        y: y * canvas.height
      }));

      // 1. Draw connecting bones
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)'; // Teal accent
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      HAND_CONNECTIONS.forEach(([i, j]) => {
        if (pts[i] && pts[j]) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      });

      // 2. Draw joint dots
      pts.forEach((pt, idx) => {
        ctx.beginPath();
        const isTip = [0, 4, 8, 12, 16, 20].includes(idx);
        ctx.arc(pt.x, pt.y, isTip ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#FF6B4A' : '#FFA07A'; // Terracotta
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  }, [showSkeleton]);

  // 4. Prediction API Caller
  const sendFrameToBackend = useCallback(async (blob) => {
    if (!backendOnline) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      const res = await fetch(`${API_BASE}/predict/image`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.detected && data.prediction) {
        setPrediction(data.prediction);
        setHandsDetected(data.hands_detected);
        drawSkeleton(data.landmarks_points || []);
        setErrorMsg('');
      } else {
        setHandsDetected(data.hands_detected || 0);
        drawSkeleton(data.landmarks_points || []);
        if (data.message) {
          setErrorMsg(data.message);
        }
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [backendOnline, drawSkeleton]);

  // 4. Capture Frame from Video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (overlayCanvasRef.current) {
      if (overlayCanvasRef.current.width !== video.videoWidth || overlayCanvasRef.current.height !== video.videoHeight) {
        overlayCanvasRef.current.width = video.videoWidth;
        overlayCanvasRef.current.height = video.videoHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        sendFrameToBackend(blob);
      }
    }, 'image/jpeg', 0.85);
  }, [sendFrameToBackend]);

  // Auto-detect loop
  useEffect(() => {
    let timer = null;
    if (cameraActive && autoDetect) {
      timer = setInterval(() => {
        captureFrame();
      }, 800); // Send snapshot every 800ms
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cameraActive, autoDetect, captureFrame]);

  // 5. File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewSrc(objectUrl);
    sendFrameToBackend(file);
  };

  // 6. Text-to-Speech (Pronunciation)
  const speakText = (text, lang = 'mr-IN') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // 7. Word Buffer Actions
  const addLetterToWord = (letter) => {
    setWordBuffer(prev => prev + letter);
  };

  const handleBackspace = () => {
    setWordBuffer(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setWordBuffer('');
  };

  const handleAddSpace = () => {
    setWordBuffer(prev => prev + ' ');
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className="container">
          {/* Header */}
          <div className={styles.headerSection}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Real-Time ISL Translation Engine
            </div>
            <h1 className={styles.title}>
              Indian Sign Language <span className={styles.titleAccent}>Translator</span>
            </h1>
            <p className={styles.subtitle}>
              Translate two-handed ISL alphabets into English and regional Marathi (मराठी) with AI landmark detection.
            </p>
          </div>

          {/* Backend Status Banner */}
          <div className={`${styles.statusBanner} ${backendOnline ? styles.statusOnline : styles.statusOffline}`}>
            <span>
              {backendOnline 
                ? '🟢 HandSpeak AI Engine Online — Ready for live translation' 
                : '🔴 AI Service Offline — Start FastAPI backend: `uvicorn app.main:app --reload --port 8000`'}
            </span>
            <button className={styles.btnSecondary} onClick={checkHealth} style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
              Refresh Status
            </button>
          </div>

          {/* Workspace */}
          <div className={styles.workspace}>
            {/* ── Left Column: Media & Input ── */}
            <div className={styles.card}>
              <div className={styles.modeTabs}>
                <button
                  className={`${styles.modeTab} ${mode === 'camera' ? styles.modeTabActive : ''}`}
                  onClick={() => { setMode('camera'); }}
                >
                  📹 Live Camera
                </button>
                <button
                  className={`${styles.modeTab} ${mode === 'upload' ? styles.modeTabActive : ''}`}
                  onClick={() => { setMode('upload'); stopCamera(); }}
                >
                  📁 Upload Photo
                </button>
              </div>

              <div className={styles.mediaContainer}>
                {mode === 'camera' ? (
                  <>
                    <video
                      ref={videoRef}
                      className={styles.videoElement}
                      style={{ display: cameraActive ? 'block' : 'none' }}
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className={styles.overlayCanvas}
                      style={{ display: cameraActive ? 'block' : 'none' }}
                    />
                    {!cameraActive && (
                      <div className={styles.cameraPlaceholder}>
                        <div className={styles.placeholderIcon}>📹</div>
                        <h3>Camera is Inactive</h3>
                        <p>Click "Start Camera" below to begin live ISL recognition.</p>
                      </div>
                    )}
                    {cameraActive && (
                      <div className={styles.cameraOverlay}>
                        <span className={styles.liveTag}>
                          <span className={styles.liveDot} /> LIVE
                        </span>
                        {isProcessing && (
                          <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            ⚡ Analyzing...
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {previewSrc ? (
                      <img src={previewSrc} alt="Preview sign" className={styles.uploadPreview} />
                    ) : (
                      <label className={styles.uploadDropzone}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <div className={styles.placeholderIcon}>📁</div>
                        <h3>Upload an ISL Sign Photo</h3>
                        <p>Click or drag a JPG/PNG of an Indian Sign Language hand sign</p>
                      </label>
                    )}
                  </>
                )}
              </div>

              {/* Hidden canvas for video extraction */}
              <canvas ref={canvasRef} className={styles.hiddenCanvas} />

              {/* Controls */}
              <div className={styles.controlsRow}>
                {mode === 'camera' ? (
                  <>
                    {!cameraActive ? (
                      <button className={styles.btnPrimary} onClick={startCamera} disabled={!backendOnline}>
                        <span>▶</span> Start Camera
                      </button>
                    ) : (
                      <>
                        <button className={styles.btnSecondary} onClick={stopCamera}>
                          <span>⏹</span> Stop Camera
                        </button>
                        <button
                          className={styles.btnAccent}
                          onClick={captureFrame}
                          disabled={isProcessing || !backendOnline}
                        >
                          📸 Snap & Translate
                        </button>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={autoDetect}
                            onChange={(e) => setAutoDetect(e.target.checked)}
                          />
                          Auto (800ms)
                        </label>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={showSkeleton}
                            onChange={(e) => {
                              setShowSkeleton(e.target.checked);
                              if (!e.target.checked && overlayCanvasRef.current) {
                                const ctx = overlayCanvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                              }
                            }}
                          />
                          🦴 Skeleton
                        </label>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label className={styles.btnPrimary} style={{ cursor: 'pointer' }}>
                      <span>📂</span> Choose Another Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {selectedFile && (
                      <button
                        className={styles.btnAccent}
                        onClick={() => sendFrameToBackend(selectedFile)}
                        disabled={isProcessing || !backendOnline}
                      >
                        ⚡ Re-Analyze
                      </button>
                    )}
                  </>
                )}
              </div>

              {errorMsg && (
                <div style={{ marginTop: '1rem', color: 'var(--color-error)', fontSize: '0.875rem' }}>
                  ⚠ {errorMsg}
                </div>
              )}
            </div>

            {/* ── Right Column: Translation Output ── */}
            <div className={`${styles.card} ${styles.resultCard}`}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Translation Output
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Detected sign translated to English and regional Marathi phonetics.
                </p>
              </div>

              {/* Big Detected Box */}
              <div className={styles.detectedLetterBox}>
                <div className={styles.bigLetter}>
                  {prediction ? prediction.letter : '—'}
                </div>

                <div className={styles.translationMeta}>
                  <div className={styles.marathiName}>
                    <span>{prediction ? prediction.marathi : 'प्रतीक्षा करा'}</span>
                    {prediction && (
                      <span className={styles.phoneticTag}>[{prediction.phonetic}]</span>
                    )}
                  </div>

                  {prediction?.example_mr && (
                    <div className={styles.exampleMarathi}>
                      <span>📍 {prediction.example_mr}</span>
                    </div>
                  )}
                </div>

                {prediction && (
                  <button
                    className={styles.audioBtn}
                    onClick={() => speakText(`${prediction.letter}. ${prediction.marathi}`)}
                    title="Pronounce translation"
                    aria-label="Pronounce translation"
                  >
                    🔊
                  </button>
                )}
              </div>

              {/* Confidence & Hands Status */}
              <div>
                <div className={styles.metaRow}>
                  <span>Model Confidence</span>
                  <strong>{prediction ? `${(prediction.confidence * 100).toFixed(1)}%` : '0%'}</strong>
                </div>
                <div className={styles.confidenceBarWrapper}>
                  <div
                    className={styles.confidenceBarFill}
                    style={{ width: prediction ? `${prediction.confidence * 100}%` : '0%' }}
                  />
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {handsDetected > 0 ? `✋ ${handsDetected} hand(s) detected via MediaPipe` : 'No hands in frame'}
                </div>
              </div>

              {/* Word Composer Buffer */}
              <div className={styles.wordComposer}>
                <div className={styles.composerHeader}>
                  <span className={styles.composerTitle}>Spelling Word Buffer</span>
                  {wordBuffer && (
                    <button
                      className={styles.composerBtn}
                      onClick={() => speakText(wordBuffer, 'en-US')}
                      title="Speak full word"
                    >
                      🔊 Speak Word
                    </button>
                  )}
                </div>

                <div className={styles.wordDisplay}>
                  {wordBuffer || <span className={styles.wordPlaceholder}>Spell names/places (e.g. P - U - N - E)...</span>}
                </div>

                <div className={styles.composerActions}>
                  <button
                    className={`${styles.composerBtn} ${styles.composerBtnPrimary}`}
                    onClick={() => prediction && addLetterToWord(prediction.letter)}
                    disabled={!prediction}
                  >
                    ➕ Add '{prediction?.letter || '?'}'
                  </button>
                  <button className={styles.composerBtn} onClick={handleAddSpace}>
                    ␣ Space
                  </button>
                  <button className={styles.composerBtn} onClick={handleBackspace} disabled={!wordBuffer}>
                    ⌫ Backspace
                  </button>
                  <button className={styles.composerBtn} onClick={handleClear} disabled={!wordBuffer}>
                    🗑 Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Collapsible ISL Reference Guide ── */}
          <section className={styles.guideSection}>
            <div>
              <h2 className={styles.guideHeading}>ISL Alphabet Reference (A–Z)</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Standard two-handed Indian Sign Language letters and their Marathi (मराठी) pronunciation:
              </p>
            </div>

            <div className={styles.guideGrid}>
              {Object.entries(DEFAULT_LABELS).map(([letter, data]) => (
                <div
                  key={letter}
                  className={styles.guideCard}
                  onClick={() => speakText(`${letter}. ${data.marathi}`)}
                  style={{ cursor: 'pointer' }}
                  title="Click to hear pronunciation"
                >
                  <div className={styles.guideLetter}>{letter}</div>
                  <div className={styles.guideMarathi}>{data.marathi}</div>
                  <div className={styles.guideExample}>{data.example_mr.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
