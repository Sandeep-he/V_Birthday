
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const store = path.join(root, 'wishes.json');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

function readWishes() {
  try {
    const data = JSON.parse(fs.readFileSync(store, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function emailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.WISH_TO_EMAIL
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

async function emailWish(entry) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Oyee Sun Na <onboarding@resend.dev>',
      to: [process.env.WISH_TO_EMAIL],
      subject: 'A birthday wish for Cheena 💗',
      text:
        `A wish was submitted on the birthday website.\n\n` +
        `Wish: ${entry.wish}\n` +
        `Received: ${entry.createdAt}\n` +
        `ID: ${entry.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#3a1930">
          <h2 style="color:#d85b96">A birthday wish for Cheena 💗</h2>
          <p>Someone left a wish on your birthday website.</p>
          <blockquote style="padding:16px;background:#fff2f8;border-left:4px solid #e88ab5;white-space:pre-wrap">${escapeHtml(entry.wish)}</blockquote>
          <p><b>Received:</b> ${escapeHtml(entry.createdAt)}</p>
          <p><b>Wish ID:</b> ${escapeHtml(entry.id)}</p>
        </div>`
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Resend error:', response.status, result);
    throw new Error(
      result.message || `Resend rejected the email (${response.status})`
    );
  }

  return result;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      emailConfigured: emailConfigured()
    });
  }

  if (req.method === 'POST' && req.url === '/api/wishes') {
    let body = '';
    let tooLarge = false;

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000 && !tooLarge) {
        tooLarge = true;
        sendJson(res, 413, { error: 'Wish is too large' });
        req.destroy();
      }
    });

    req.on('end', async () => {
      if (tooLarge) return;

      try {
        const data = JSON.parse(body);
        const wish = String(data.wish || '').trim();

        if (!wish) {
          return sendJson(res, 400, { error: 'Wish is empty' });
        }

        if (wish.length > 3000) {
          return sendJson(res, 413, {
            error: 'Wish must be 3000 characters or fewer'
          });
        }

        const entry = {
          id: Date.now().toString(36) + '-' +
            Math.random().toString(36).slice(2, 7),
          wish,
          createdAt: new Date().toISOString()
        };

        // Local file storage on Render Free is temporary.
        const entries = readWishes();
        entries.push(entry);

        try {
          fs.writeFileSync(store, JSON.stringify(entries, null, 2));
        } catch (err) {
          console.error('Could not write wishes file:', err.message);
        }

        if (!emailConfigured()) {
          return sendJson(res, 503, {
            error: 'Email is not configured on the server yet.'
          });
        }

        try {
          await emailWish(entry);
          return sendJson(res, 201, {
            ...entry,
            emailConfigured: true,
            emailSent: true,
            emailTo: process.env.WISH_TO_EMAIL
          });
        } catch (err) {
          console.error('Wish email failed:', err.message);
          return sendJson(res, 502, {
            error: 'The wish could not be emailed. Check the Resend settings and server logs.'
          });
        }
      } catch (err) {
        console.error('Wish request failed:', err.message);
        return sendJson(res, 400, {
          error: 'Invalid wish request.'
        });
      }
    });

    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname
    );
  } catch {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  if (pathname === '/') pathname = '/index.html';

  const file = path.resolve(root, '.' + pathname);

  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      return res.end('Not found');
    }

    res.writeHead(200, {
      'Content-Type':
        mime[path.extname(file).toLowerCase()] ||
        'application/octet-stream',
      'Cache-Control': 'no-cache'
    });

    res.end(data);
  });
});

const port = Number(process.env.PORT) || 5501;

server.listen(port, '0.0.0.0', () => {
  console.log(`Birthday website listening on port ${port}`);
  console.log(
    `Resend email: ${emailConfigured() ? 'configured' : 'not configured'}`
  );
});
