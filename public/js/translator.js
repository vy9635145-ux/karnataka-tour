/* =====================================================================
   Language Translator with Voice  –  script.js
   Plain JavaScript (no frameworks).

   How it works (read top to bottom):
   1. LANGUAGES      – list of languages + the codes each API needs
   2. DOM            – grab every element we need from the page
   3. Helpers        – small utilities (errors, counters, loading)
   4. Translation    – calls the free MyMemory translation API
   5. Speech output  – Text-to-Speech  (speechSynthesis)
   6. Speech input   – Voice typing    (SpeechRecognition)
   7. Buttons        – connects every button to its function
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. LANGUAGES
     [ translation code , name shown in the menu , speech (BCP-47) code ]
     - The translation API uses short codes such as "hi".
     - Speech recognition / synthesis need a region code such as "hi-IN".
     Add a new language by adding one more line here.
  ------------------------------------------------------------------ */
  const LANGUAGES = [
    ['en',    'English',               'en-US'],
    ['hi',    'Hindi (हिन्दी)',          'hi-IN'],
    ['es',    'Spanish (Español)',     'es-ES'],
    ['fr',    'French (Français)',     'fr-FR'],
    ['de',    'German (Deutsch)',      'de-DE'],
    ['ja',    'Japanese (日本語)',       'ja-JP'],
    ['ar',    'Arabic (العربية)',       'ar-SA'],
    ['bn',    'Bengali (বাংলা)',        'bn-IN'],
    ['pt',    'Portuguese (Português)', 'pt-BR'],
    ['ru',    'Russian (Русский)',     'ru-RU'],
    ['it',    'Italian (Italiano)',    'it-IT'],
    ['zh-CN', 'Chinese (中文)',         'zh-CN'],
    ['ko',    'Korean (한국어)',         'ko-KR'],
    ['ta',    'Tamil (தமிழ்)',          'ta-IN'],
    ['te',    'Telugu (తెలుగు)',        'te-IN'],
    ['kn',    'Kannada (ಕನ್ನಡ)',        'kn-IN'],
    ['ml',    'Malayalam (മലയാളം)',     'ml-IN'],
    ['mr',    'Marathi (मराठी)',        'mr-IN'],
    ['gu',    'Gujarati (ગુજરાતી)',      'gu-IN'],
    ['pa',    'Punjabi (ਪੰਜਾਬੀ)',        'pa-IN'],
    ['ur',    'Urdu (اردو)',           'ur-PK'],
    ['tr',    'Turkish (Türkçe)',      'tr-TR'],
    ['nl',    'Dutch (Nederlands)',    'nl-NL'],
    ['id',    'Indonesian',            'id-ID'],
    ['th',    'Thai (ไทย)',            'th-TH'],
    ['vi',    'Vietnamese',            'vi-VN']
  ];

  const MAX_CHARS = 2000;      // longest text we accept (keeps the free API happy)
  const CHUNK_SIZE = 450;      // MyMemory accepts about 500 characters per request
  const REQUEST_TIMEOUT = 15000; // give up on a request after 15 seconds
  // Optional: put your e-mail here. MyMemory then raises the free daily limit.
  const CONTACT_EMAIL = '';

  /* ------------------------------------------------------------------
     2. DOM  – every element we need, grouped per card ("src" / "tgt")
  ------------------------------------------------------------------ */
  const root = document.getElementById('translator');
  if (!root) return; // page does not contain the translator
  const $ = (selector) => root.querySelector(selector);

  const side = {
    src: {
      select: $('#lt-src-lang'), text: $('#lt-src-text'), count: $('#lt-src-count'),
      mic: $('[data-mic="src"]'), speak: $('[data-speak="src"]'), clear: $('[data-clear="src"]'),
      card: $('[data-card="src"]')
    },
    tgt: {
      select: $('#lt-tgt-lang'), text: $('#lt-tgt-text'), count: $('#lt-tgt-count'),
      mic: $('[data-mic="tgt"]'), speak: $('[data-speak="tgt"]'), clear: $('[data-clear="tgt"]'),
      card: $('[data-card="tgt"]')
    }
  };
  const translateBtn = $('#lt-translate');
  const swapBtn = $('#lt-swap');
  const autoSpeak = $('#lt-auto');
  const banner = $('#lt-banner');
  const bannerText = $('#lt-banner-text');
  const direction = $('#lt-direction');

  // "Active" side = the card the user typed / spoke in last.
  // The Translate button always translates FROM the active side.
  let active = 'src';

  /* ------------------------------------------------------------------
     3. HELPERS
  ------------------------------------------------------------------ */
  const other = (s) => (s === 'src' ? 'tgt' : 'src');
  const langInfo = (code) => LANGUAGES.find((l) => l[0] === code) || LANGUAGES[0];
  const shortName = (code) => langInfo(code)[1].split(' (')[0];

  // Show a friendly error / info message at the top of the translator.
  function showMessage(message, type) {
    bannerText.textContent = message;
    banner.className = 'lt-banner ' + (type || 'error');
    banner.hidden = false;
  }
  function hideMessage() { banner.hidden = true; }

  // Update the "0 / 2000" counter of one card.
  function updateCount(s) {
    const n = side[s].text.value.length;
    side[s].count.textContent = n + ' / ' + MAX_CHARS;
    side[s].count.classList.toggle('full', n >= MAX_CHARS);
  }

  // Show which direction the Translate button will work in.
  function updateDirection() {
    const from = side[active].select.value;
    const to = side[other(active)].select.value;
    direction.textContent = 'Translate: ' + shortName(from) + '  →  ' + shortName(to);
    side.src.card.classList.toggle('active', active === 'src');
    side.tgt.card.classList.toggle('active', active === 'tgt');
  }

  function setActive(s) { active = s; updateDirection(); }

  // Show / hide the spinner while we wait for the translation.
  function setLoading(on) {
    translateBtn.disabled = on;
    translateBtn.classList.toggle('loading', on);
    translateBtn.querySelector('.lt-btn-label').textContent = on ? 'Translating…' : 'Translate';
    root.classList.toggle('is-loading', on);
  }

  // Fill both drop-down menus with the language list.
  function fillLanguages() {
    const options = LANGUAGES.map((l) => '<option value="' + l[0] + '">' + l[1] + '</option>').join('');
    side.src.select.innerHTML = options;
    side.tgt.select.innerHTML = options;
    side.src.select.value = 'en';
    side.tgt.select.value = 'hi';
  }

  /* ------------------------------------------------------------------
     4. TRANSLATION  (MyMemory free API – no key needed, internet needed)
  ------------------------------------------------------------------ */

  // MyMemory sometimes returns HTML entities like &#39; – turn them into text.
  function decodeEntities(text) {
    const box = document.createElement('textarea');
    box.innerHTML = text;
    return box.value;
  }

  // Cut long text into pieces (at sentence ends where possible).
  function splitText(text) {
    const pieces = [];
    const sentences = text.match(/[^.!?।؟。\n]+[.!?।؟。]*\s*|\n/g) || [text];
    let current = '';
    sentences.forEach((sentence) => {
      if ((current + sentence).length > CHUNK_SIZE && current) { pieces.push(current); current = ''; }
      // A single very long sentence is cut by force.
      while (sentence.length > CHUNK_SIZE) { pieces.push(sentence.slice(0, CHUNK_SIZE)); sentence = sentence.slice(CHUNK_SIZE); }
      current += sentence;
    });
    if (current) pieces.push(current);
    return pieces;
  }

  // Translate ONE small piece of text.
  async function translatePiece(text, from, to) {
    if (!text.trim()) return text; // blank lines stay blank
    let url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) +
              '&langpair=' + encodeURIComponent(from + '|' + to);
    if (CONTACT_EMAIL) url += '&de=' + encodeURIComponent(CONTACT_EMAIL);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      throw new Error(err.name === 'AbortError' ? 'timeout' : 'network');
    } finally {
      clearTimeout(timer);
    }
    if (response.status === 429) throw new Error('limit');
    if (!response.ok) throw new Error('server');

    const data = await response.json();
    const result = (data.responseData && data.responseData.translatedText) || '';
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(result) || Number(data.responseStatus) === 429) throw new Error('limit');
    if (Number(data.responseStatus) !== 200 || !result) throw new Error('server');
    return decodeEntities(result);
  }

  // Translate the whole text piece by piece (one after another, to stay polite to the API).
  async function translateText(text, from, to) {
    const pieces = splitText(text);
    let output = '';
    for (const piece of pieces) {
      const lead = piece.match(/^\s*/)[0];
      const tail = piece.match(/\s*$/)[0];
      output += lead + (await translatePiece(piece.trim(), from, to)) + tail;
    }
    return output.trim();
  }

  // Turn an internal error into a message a normal person understands.
  function errorMessage(err) {
    switch (err.message) {
      case 'network': return 'Network error. Please check your internet connection and try again.';
      case 'timeout': return 'The translation service took too long to answer. Please try again.';
      case 'limit':   return 'The free translation limit has been reached for now. Please try again later.';
      default:        return 'Sorry, the translation failed. Please try again in a moment.';
    }
  }

  // Main action: runs when the user presses "Translate".
  async function translate() {
    hideMessage();
    const from = active, to = other(active);
    const text = side[from].text.value.trim();

    if (!text) { showMessage('Please type or speak some text first.', 'warn'); side[from].text.focus(); return; }
    if (!navigator.onLine) { showMessage('You are offline. Please connect to the internet to translate.'); return; }

    const fromCode = side[from].select.value;
    const toCode = side[to].select.value;
    if (fromCode === toCode) {
      // Same language on both sides: nothing to translate, just copy the text.
      side[to].text.value = text; updateCount(to);
      showMessage('Both languages are the same, so the text was copied as it is.', 'info');
      return;
    }

    stopSpeaking();
    setLoading(true);
    try {
      const result = await translateText(text.slice(0, MAX_CHARS), fromCode, toCode);
      side[to].text.value = result;
      updateCount(to);
      // Optional: read the translation aloud automatically.
      if (autoSpeak.checked) speak(to);
    } catch (err) {
      showMessage(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------
     5. SPEECH OUTPUT  (Text-to-Speech with speechSynthesis)
  ------------------------------------------------------------------ */
  const synth = window.speechSynthesis;
  let voices = [];
  let speakingSide = null;
  let speakToken = 0; // changes every time we start/stop, so old callbacks are ignored

  function loadVoices() { if (synth) voices = synth.getVoices(); }
  if (synth) { loadVoices(); synth.addEventListener('voiceschanged', loadVoices); }

  // Find an installed voice that matches the language (e.g. "hi-IN").
  function findVoice(speechLang) {
    const wanted = speechLang.toLowerCase();
    const base = wanted.split('-')[0];
    return voices.find((v) => v.lang.replace('_', '-').toLowerCase() === wanted) ||
           voices.find((v) => v.lang.toLowerCase().startsWith(base)) || null;
  }

  function setSpeakingUI(s) {
    speakingSide = s;
    ['src', 'tgt'].forEach((k) => side[k].speak.classList.toggle('on', k === s));
  }

  function stopSpeaking() {
    speakToken++;
    if (synth) synth.cancel();
    setSpeakingUI(null);
  }

  // Long text can stop half-way in some browsers, so we read it in small parts.
  function speechParts(text) {
    const parts = [];
    (text.match(/[^.!?।؟。\n]+[.!?।؟。]*/g) || [text]).forEach((p) => {
      p = p.trim();
      while (p.length > 180) { // cut very long sentences at a space
        let cut = p.lastIndexOf(' ', 180); if (cut < 60) cut = 180;
        parts.push(p.slice(0, cut)); p = p.slice(cut).trim();
      }
      if (p) parts.push(p);
    });
    return parts;
  }

  function speak(s) {
    hideMessage();
    if (!synth || !('SpeechSynthesisUtterance' in window)) {
      showMessage('Text-to-speech is not supported in this browser. Please try Chrome, Edge or Safari.'); return;
    }
    const text = side[s].text.value.trim();
    if (!text) { showMessage('There is no text to read aloud.', 'warn'); return; }

    // Pressing the speaker again while it is playing = stop.
    if (speakingSide === s) { stopSpeaking(); return; }
    stopSpeaking();

    const speechLang = langInfo(side[s].select.value)[2];
    const voice = findVoice(speechLang);
    if (!voice && voices.length) {
      showMessage('No ' + shortName(side[s].select.value) + ' voice is installed on this device, so the audio may be silent or use a different voice. You can install one in your system language settings.', 'warn');
    }

    const parts = speechParts(text);
    const token = ++speakToken;
    setSpeakingUI(s);

    const next = (i) => {
      if (token !== speakToken) return;          // stopped meanwhile
      if (i >= parts.length) { setSpeakingUI(null); return; }
      const u = new SpeechSynthesisUtterance(parts[i]);
      u.lang = speechLang;
      if (voice) u.voice = voice;
      u.onend = () => next(i + 1);
      u.onerror = (e) => {
        if (token !== speakToken || e.error === 'canceled' || e.error === 'interrupted') return;
        showMessage('Sorry, the audio could not be played (' + e.error + ').');
        setSpeakingUI(null);
      };
      synth.speak(u);
    };
    // A tiny delay avoids a Chrome bug where speak() right after cancel() is ignored.
    setTimeout(() => next(0), 60);
  }

  /* ------------------------------------------------------------------
     6. SPEECH INPUT  (Voice typing with SpeechRecognition)
  ------------------------------------------------------------------ */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listeningSide = null;

  function setListeningUI(s) {
    listeningSide = s;
    ['src', 'tgt'].forEach((k) => {
      side[k].mic.classList.toggle('on', k === s);
      side[k].card.classList.toggle('listening', k === s);
    });
  }

  function stopListening() { if (recognition) { try { recognition.abort(); } catch (e) { /* ignore */ } } }

  function recognitionError(code) {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed': return 'Microphone permission was blocked. Click the lock icon in the address bar, allow the microphone, then try again. (Voice input needs https:// or localhost.)';
      case 'no-speech':           return 'No speech was heard. Please tap the microphone and speak again.';
      case 'audio-capture':       return 'No microphone was found. Please connect a microphone and try again.';
      case 'network':             return 'Voice input needs an internet connection. Please check your network.';
      case 'language-not-supported': return 'Voice input does not support this language in your browser.';
      case 'aborted':             return '';
      default:                    return 'Voice input failed (' + code + '). Please try again.';
    }
  }

  function listen(s) {
    hideMessage();
    if (!SpeechRecognition) {
      showMessage('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.'); return;
    }
    // Pressing the mic again while listening = stop.
    if (listeningSide === s) { recognition.stop(); return; }
    stopListening();
    stopSpeaking();
    setActive(s);

    const box = side[s].text;
    const startText = box.value.trim() ? box.value.trimEnd() + ' ' : ''; // keep text already typed
    let finalText = '';
    let gotText = false;

    recognition = new SpeechRecognition();
    recognition.lang = langInfo(side[s].select.value)[2];
    recognition.interimResults = true; // show words while the user is still talking
    recognition.continuous = false;

    recognition.onstart = () => setListeningUI(s);
    recognition.onresult = (event) => {
      let interim = '';
      finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece; else interim += piece;
      }
      box.value = (startText + finalText + interim).slice(0, MAX_CHARS);
      gotText = true;
      updateCount(s);
    };
    recognition.onerror = (event) => {
      const msg = recognitionError(event.error);
      if (msg) showMessage(msg, event.error === 'no-speech' ? 'warn' : 'error');
    };
    recognition.onend = () => {
      setListeningUI(null);
      // After speaking, translate straight away – feels like a real voice translator.
      if (gotText && box.value.trim()) translate();
    };

    try { recognition.start(); }
    catch (err) { setListeningUI(null); showMessage('Could not start the microphone. Please try again.'); }
  }

  /* ------------------------------------------------------------------
     7. BUTTONS  – connect everything
  ------------------------------------------------------------------ */
  fillLanguages();
  updateCount('src'); updateCount('tgt'); updateDirection();

  // Typing in a card makes it the active (source) card.
  ['src', 'tgt'].forEach((s) => {
    side[s].text.addEventListener('input', () => { updateCount(s); setActive(s); });
    side[s].text.addEventListener('focus', () => setActive(s));
    side[s].mic.addEventListener('click', () => listen(s));
    side[s].speak.addEventListener('click', () => speak(s));
    side[s].clear.addEventListener('click', () => {
      stopSpeaking(); stopListening(); hideMessage();
      side[s].text.value = ''; updateCount(s); side[s].text.focus();
    });
    // Changing a language: never allow the same language on both sides.
    side[s].select.addEventListener('focus', function () { this.dataset.prev = this.value; });
    side[s].select.addEventListener('change', function () {
      const o = side[other(s)].select;
      if (o.value === this.value) o.value = this.dataset.prev || o.value; // swap quietly
      this.dataset.prev = this.value;
      stopSpeaking(); updateDirection();
    });
  });

  translateBtn.addEventListener('click', translate);

  // Ctrl + Enter inside a text box also translates.
  root.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); translate(); }
  });

  // Swap languages AND texts.
  swapBtn.addEventListener('click', () => {
    stopSpeaking(); stopListening(); hideMessage();
    const a = side.src, b = side.tgt;
    [a.select.value, b.select.value] = [b.select.value, a.select.value];
    [a.text.value, b.text.value] = [b.text.value, a.text.value];
    updateCount('src'); updateCount('tgt'); updateDirection();
    swapBtn.classList.add('spin');
    setTimeout(() => swapBtn.classList.remove('spin'), 400);
  });

  banner.querySelector('.lt-banner-close').addEventListener('click', hideMessage);

  // Browser went offline / online.
  window.addEventListener('offline', () => showMessage('You are offline. Translation needs an internet connection.', 'warn'));
  window.addEventListener('online', hideMessage);

  // Stop audio / microphone when the page is closed.
  window.addEventListener('beforeunload', () => { stopSpeaking(); stopListening(); });
})();
