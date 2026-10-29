OYEE... SUN NA. — DREAMY BIRTHDAY WEBSITE

This is a fresh, frame-by-frame remake inspired by the supplied dreamy pink, rose, candlelight and tulip collage.

RUN IT (recommended for saving wishes):
1. Extract the whole folder from the ZIP.
2. Install Node.js LTS if it is not already installed: https://nodejs.org/
3. Double-click START_SERVER.bat.
4. Keep the terminal window open.
5. Open http://localhost:5501 in your browser.

Do not open index.html directly if you want wishes saved to wishes.json. The wish form posts to the local server, and each saved wish includes a timestamp. EMAIL NOTIFICATIONS (Gmail SMTP):
1. On first run, START_SERVER.bat creates .env from .env.example and opens it.
2. Replace PUT_YOUR_GOOGLE_APP_PASSWORD_HERE with a Google App Password for starevilgod@gmail.com. Enable 2-Step Verification first, then create an App Password in your Google Account security settings. Keep the file private.
3. Save .env, close the setup window, and run START_SERVER.bat again. The server uses environment variables, not credentials in frontend JavaScript.
4. Wishes are always written to wishes.json first. If SMTP is configured, the server emails the wish to starevilgod@gmail.com. The on-screen status distinguishes saved wishes from emails that were actually sent.
5. If Gmail SMTP authentication fails, verify that 2-Step Verification is enabled and that you entered the 16-character Google App Password (not your normal Gmail password). Never share your normal account password.

IMPORTANT BROWSER LIMITATIONS:
- The website attempts to start music immediately. Modern browsers often block audio with sound until the first click/key interaction; if blocked, the first interaction starts it. This is a browser policy and cannot be overridden reliably by website code.
- Memory videos are muted, autoplay, loop, and play inline so they can start automatically. Most browsers require videos to be muted for autoplay.
- This local server saves wishes on the computer running it. For her to send a wish from another device, deploy the website/server online; do not expose your local .env file.

CONTROLS:
- Use the centered bottom arrows/buttons to move frame by frame.
- Music attempts to start on opening; if the browser blocks it, the first interaction starts it. Use the top-right music button to start/stop manually. It is separate from the wish text box.
- On the birthday-date joke, 29 October runs away but remains visible; 30 October is selectable.
- Each photo and video is shown in its own contained memory frame with a unique remark.
- Five envelopes can be opened whenever she needs a little note.
- Replay the story resets it to the first frame.

FOLDER LAYOUT:
index.html, style.css, script.js, media-list.json, server.js, START_SERVER.bat, wishes.json, media/
