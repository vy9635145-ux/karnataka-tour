# Language Translator with Voice

Plain HTML5 + CSS3 + JavaScript. No React, no Vite, no npm.

## Run with VS Code + Live Server
1. Install **VS Code** and the **Live Server** extension (Ritwick Dey) from the Extensions panel (`Ctrl+Shift+X`).
2. `File > Open Folder...` and choose the `language-translator` folder.
3. Right-click `index.html` and choose **Open with Live Server** (or click **Go Live** at the bottom right).
4. The site opens at `http://127.0.0.1:5500`. Use **Google Chrome or Microsoft Edge** for voice features.

> Voice input only works on `http://localhost`, `http://127.0.0.1` or `https://`. Live Server is perfect. Opening the file by double-click may block the microphone.

## Files
- `index.html` - page structure
- `style.css` - design (white, soft orange and purple; responsive)
- `script.js` - all the logic, commented step by step

## How to use
- Choose the **From** and **To** languages, type or tap the orange microphone and speak.
- Press **Translate**. Voice input translates automatically when you stop speaking.
- The purple speaker reads a card aloud in its language. Press it again to stop.
- Switch on **Speak translation automatically** to hear every translation.
- The **swap** button exchanges languages and texts. The trash button clears one card.
- You can type or speak in **either** card; the Translate button works from the card you used last (see the line under the button).
- **Ctrl + Enter** also translates.

## Notes
- Translation uses the free **MyMemory** API (no key). The free daily limit is small; put your e-mail in `CONTACT_EMAIL` at the top of `script.js` to raise it.
- Speech uses your browser's **Web Speech API**. A language's voice must be installed on your device for audio to play (Windows: Settings > Time & Language > Speech).
- Add a language: add one line to the `LANGUAGES` list in `script.js`.
- Errors handled: empty text, offline, timeout, daily limit, server error, blocked microphone, no microphone, no speech heard, unsupported browser, missing voice.
