# HandSpeak

HandSpeak is an inclusive web platform connecting sign-language learners and organizations.

## Offline support and installable PWA

The production build provides an installable PWA. Its service worker precaches the app shell, self-hosted fonts, sign images, and local public assets, then serves `index.html` for offline app navigation. The development server does not enable the service worker; test the production build:

```sh
npm run build
npm run preview
```

### Offline-readiness checklist

- [ ] Build and start the production preview with the commands above; open it while online.
- [ ] Visit `/`, `/login`, `/dashboard`, `/translate`, `/reverse-translate`, and `/speed-quiz` online. Sign in before testing protected routes.
- [ ] Open `/translate`, analyze a local sign photo or start translation, and wait for “Ready for offline use”. This first use downloads the local classifier, hand-landmarker task, and MediaPipe WASM.
- [ ] In Chrome DevTools **Application > Service Workers**, confirm the service worker is activated and controls the page.
- [ ] In **Application > Cache Storage**, confirm the app-shell cache and, after first translation, `handspeak-offline-model-assets` contain their expected assets.
- [ ] In DevTools **Network**, select **Offline**. Hard-reload `/translate`, `/reverse-translate`, `/speed-quiz`, and `/dashboard`; confirm each route loads. On Translate, test a local sign photo. Camera use also requires camera permission.
- [ ] Restore connectivity and run Lighthouse's **Progressive Web App** audit. Confirm the manifest, icons, service worker, and installability checks; note any browser-specific warnings.

The first app visit requires the network to download the app shell and install the worker. The development server does not test offline behavior.

DM Sans and Fraunces are bundled locally, so fonts do not require Google Fonts at runtime.

## Offline sign translation

Translate runs MediaPipe HandLandmarker and the exported 150-tree RandomForest in the browser when the optional FastAPI backend is not configured or reachable. Model/WASM assets load lazily on first translation and are runtime-cached for later offline use. Camera access requires HTTPS or `localhost` and browser permission; uploaded local photos work offline once model assets are cached.

The Python backend remains an optional online inference provider. `VITE_API_BASE` and `VITE_WS_URL` are optional; when the API base is configured and `/health` responds, the page uses the server path. See [.env.example](./.env.example).

To regenerate the browser classifier and label mapping after updating the trained model:

```sh
python ml_backend/scripts/export_model.py
python ml_backend/scripts/test_browser_parity.py
```

The parity check compares Python and JavaScript feature vectors, predicted labels, and rounded confidence for fixed landmarks.

## Offline authentication and learning data

Supabase sign-in and sign-up require an internet connection. After successful sign-in, HandSpeak caches a minimal profile in IndexedDB (user id, email, account type, name, and organization contact details when applicable); passwords and Supabase tokens are not copied there. A previously signed-in user can reopen the app offline on that device. The saved Supabase session is revalidated when connectivity returns; if invalid or expired, log in again online. Signing out clears the cached profile.

Quiz best scores, quiz history, lesson/translation history, and progress are kept locally per user in IndexedDB. The legacy `speedQuizBest` localStorage value migrates on that user's first quiz load. There is no Supabase progress table in this project, so pending learning updates remain on-device until a sync destination exists.

## Remaining network requirements and limitations

- First visit: network access is needed to download the site shell and service worker.
- First sign-in/sign-up on a device and later session validation require Supabase connectivity.
- First local translation downloads roughly 35.5 MB of model and WASM assets (uncompressed). Clearing site data or browser storage eviction means downloading them again; leave adequate device storage.
- On-device inference uses the CPU and may be slower on lower-powered phones. Recognition also depends on lighting, camera framing, and model training data.
- Learning progress has no remote sync because there is no Supabase progress table.
- PWA installation, storage retention, and camera behavior vary by browser. iOS Safari has platform-specific installation/storage limitations compared with desktop Chrome.
