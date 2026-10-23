import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import { recordLearningHistory } from '../../lib/offlineDb';
import { loadLocalSignInference } from '../../lib/localSignInference';
import { extractFeatures } from '../../lib/signFeatures';
import styles from './TranslatePage.module.css';

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || '';
const WS_URL = import.meta.env.VITE_WS_URL || '';

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
  "Z": { "english": "Z", "marathi": "झेड", "phonetic": "Z", "example_mr": "झेंडा (Flag)" },
  "Namaskar": { "english": "Namaste/Hello", "marathi": "नमस्कार", "phonetic": "Namaskar", "example_mr": "नमस्कार (Hello)" },
  "Madat": { "english": "Help", "marathi": "मदत", "phonetic": "Madat", "example_mr": "मदत करा (Help me)" },
  "Dawakhana": { "english": "Hospital", "marathi": "दवाखाना", "phonetic": "Dawakhana", "example_mr": "दवाखान्यात जा (Go to hospital)" },
  "Police": { "english": "Police", "marathi": "पोलीस", "phonetic": "Police", "example_mr": "पोलीस स्टेशन (Police station)" },
  "Pune": { "english": "Pune", "marathi": "पुणे", "phonetic": "Pune", "example_mr": "मी पुण्यात आहे (I am in Pune)" },
  "Pani": { "english": "Water", "marathi": "पाणी", "phonetic": "Paani", "example_mr": "मला पाणी द्या (Give me water)" },
  "Jevan": { "english": "Food/Meal", "marathi": "जेवण", "phonetic": "Jevan", "example_mr": "जेवण तयार आहे (Food is ready)" }
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
  const [modelLoading, setModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState('');
  const [localReady, setLocalReady] = useState(false);

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
  const localProviderRef = useRef(null);
  const wsRef = useRef(null);

  const { user } = useAuth();
  const lastLoggedSign = useRef('');
  const lastLoggedTime = useRef(0);

  const logSignPractice = useCallback((letter) => {
    if (!user?.id || !letter) return;
    const now = Date.now();
    if (lastLoggedSign.current === letter && now - lastLoggedTime.current < 6000) return;
    lastLoggedSign.current = letter;
    lastLoggedTime.current = now;
    recordLearningHistory(user.id, 'translateHistory', {
      sign: letter,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  }, [user?.id]);

  autoDetectRef.current = autoDetect;
  isProcessingRef.current = isProcessing;

  // 1. Check Backend Health
  const checkHealth = useCallback(async () => {
    if (!API_BASE) return;
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
    if (!API_BASE) return undefined;
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const ensureLocalProvider = useCallback(async () => {
    if (localProviderRef.current) return localProviderRef.current;
    setModelLoading(true);
    setModelProgress('Downloading offline model…');
    try {
      const provider = await loadLocalSignInference(setModelProgress);
      localProviderRef.current = provider;
      setLocalReady(true);
      return provider;
    } finally {
      setModelLoading(false);
    }
  }, []);

  // 2. Camera Controls
  const startCamera = async () => {
    if (!API_BASE || !backendOnline) {
      try {
        await ensureLocalProvider();
      } catch (error) {
        console.error('Unable to prepare local translation:', error);
        setErrorMsg(`Unable to prepare offline translation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

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
      setErrorMsg(err instanceof Error && modelLoading
        ? `Unable to prepare offline translation: ${err.message}`
        : 'Unable to access camera. Please allow camera permissions in your browser.');
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

  const applyServerResult = useCallback((data) => {
    setHandsDetected(data.hands_detected || 0);
    drawSkeleton(data.landmarks_points || []);
    if (data.success && data.detected && data.prediction) {
      setPrediction(data.prediction);
      logSignPractice(data.prediction.letter);
      setErrorMsg('');
    } else if (data.message || data.error) {
      setErrorMsg(data.message || data.error);
    }
  }, [drawSkeleton, logSignPractice]);

  const runLocalInference = useCallback(async (source, isVideo) => {
    const provider = await ensureLocalProvider();
    let result;
    if (isVideo) {
      result = provider.detector.detectForVideo(source, performance.now());
    } else {
      await provider.detector.setOptions({ runningMode: 'IMAGE' });
      try {
        result = provider.detector.detect(source);
      } finally {
        await provider.detector.setOptions({ runningMode: 'VIDEO' });
      }
    }

    const { features, numHands, rawPoints } = extractFeatures(result.landmarks);
    setHandsDetected(numHands);
    drawSkeleton(rawPoints);
    if (!features) {
      setErrorMsg('No hands detected in image.');
      return;
    }

    const localPrediction = provider.predict(features);
    const mapping = provider.labels[localPrediction.letter] || {};
    setPrediction({
      ...localPrediction,
      english: mapping.english || localPrediction.letter,
      marathi: mapping.marathi || localPrediction.letter,
      phonetic: mapping.phonetic || localPrediction.letter,
      example_mr: mapping.example_mr || '',
    });
    logSignPractice(localPrediction.letter);
    setErrorMsg('');
  }, [drawSkeleton, ensureLocalProvider, logSignPractice]);

  // Uses the configured server when healthy; otherwise inference runs locally.
  const sendFrameToBackend = useCallback(async (blob) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      if (API_BASE && backendOnline) {
        try {
          const formData = new FormData();
          formData.append('file', blob, 'frame.jpg');
          const response = await fetch(`${API_BASE}/predict/image`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          applyServerResult(await response.json());
          return;
        } catch (serverError) {
          console.error('Server inference failed; switching to local inference:', serverError);
          setBackendOnline(false);
        }
      }

      const image = await createImageBitmap(blob);
      try {
        await runLocalInference(image, false);
      } finally {
        image.close();
      }
    } catch (error) {
      console.error('Inference error:', error);
      setErrorMsg(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [applyServerResult, backendOnline, runLocalInference]);

  useEffect(() => {
    if (!cameraActive || !API_BASE || !backendOnline || !autoDetect || !WS_URL) {
      return undefined;
    }

    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      try {
        applyServerResult(JSON.parse(event.data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setErrorMsg('The translation server returned an invalid response.');
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isProcessingRef.current = false;
      setIsProcessing(false);
    };
    ws.onclose = () => {
      isProcessingRef.current = false;
      setIsProcessing(false);
    };
    wsRef.current = ws;

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [applyServerResult, autoDetect, backendOnline, cameraActive]);

  // 4. Capture a frame locally or send it to the optional Python backend.
  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isProcessingRef.current || video.videoWidth === 0 || video.videoHeight === 0) return;

    if (!API_BASE || !backendOnline) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      try {
        await runLocalInference(video, true);
      } catch (error) {
        console.error('Local inference failed:', error);
        setErrorMsg(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = video.videoWidth;
      overlayCanvasRef.current.height = video.videoHeight;
    }
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    isProcessingRef.current = true;
    setIsProcessing(true);
    canvas.toBlob((blob) => {
      if (!blob) {
        isProcessingRef.current = false;
        setIsProcessing(false);
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(blob);
      } else {
        isProcessingRef.current = false;
        setIsProcessing(false);
        void sendFrameToBackend(blob);
      }
    }, 'image/jpeg', 0.85);
  }, [backendOnline, runLocalInference, sendFrameToBackend]);

  // Keep camera inference responsive without running detection on every paint.
  useEffect(() => {
    if (!cameraActive || !autoDetect) return undefined;
    let animationFrame = 0;
    let lastRun = 0;
    const interval = !API_BASE || !backendOnline ? 120 : (WS_URL ? 150 : 800);
    const detectFrame = (timestamp) => {
      if (timestamp - lastRun >= interval) {
        lastRun = timestamp;
        void captureFrame();
      }
      animationFrame = requestAnimationFrame(detectFrame);
    };
    animationFrame = requestAnimationFrame(detectFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [autoDetect, backendOnline, cameraActive, captureFrame]);

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
          <div className={`${styles.statusBanner} ${backendOnline || localReady || !API_BASE ? styles.statusOnline : styles.statusOffline}`}>
            <span>
              {backendOnline
                ? '🟢 HandSpeak AI Engine Online — Using server translation'
                : localReady
                  ? '🟢 On-device translation — Ready for offline use'
                  : API_BASE
                    ? '🟠 Translation server unavailable — On-device translation is available'
                    : '🟢 On-device translation — The offline model loads when you start translating'}
              {modelLoading && (
                <span className={styles.modelProgress} role="status" aria-live="polite">
                  {modelProgress || 'Downloading offline model…'}
                </span>
              )}
            </span>
            {API_BASE && (
              <button className={styles.btnSecondary} onClick={checkHealth} style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
                Refresh Status
              </button>
            )}
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
                      <button className={styles.btnPrimary} onClick={startCamera} disabled={modelLoading}>
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
                          disabled={isProcessing}
                        >
                          📸 Snap & Translate
                        </button>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={autoDetect}
                            onChange={(e) => setAutoDetect(e.target.checked)}
                          />
                          Auto detect
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
                        disabled={isProcessing}
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
              <h2 className={styles.guideHeading}>ISL Reference (Alphabets & Words)</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Standard two-handed Indian Sign Language letters and Pune-specific words with Marathi (मराठी) pronunciation:
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
