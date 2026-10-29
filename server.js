const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const store = path.join(root, 'wishes.json');

// Load local .env without requiring an additional package. Never put secrets in frontend files.
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !match[1].startsWith('#') && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  }
}
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch {}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.mp3':'audio/mpeg'};
function readWishes(){try{const data=JSON.parse(fs.readFileSync(store,'utf8'));return Array.isArray(data)?data:[]}catch{return []}}
function sendJson(res, status, body){res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
function emailConfigured(){return !!(nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.WISH_TO_EMAIL);}
async function emailWish(entry){
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  await transporter.sendMail({from:process.env.MAIL_FROM || process.env.SMTP_USER,to:process.env.WISH_TO_EMAIL,subject:'A birthday wish from Cheena 💗',text:`A wish was sent on your birthday website.\n\nWish: ${entry.wish}\nReceived: ${entry.createdAt}\nID: ${entry.id}`,html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#3a1930"><h2 style="color:#d85b96">A birthday wish for Cheena 💗</h2><p>Someone left a wish on your birthday website.</p><blockquote style="padding:16px;background:#fff2f8;border-left:4px solid #e88ab5;white-space:pre-wrap">${escapeHtml(entry.wish)}</blockquote><p><b>Received:</b> ${entry.createdAt}</p><p><b>Wish ID:</b> ${entry.id}</p></div>`});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const server = http.createServer((req,res)=>{
  if(req.method==='GET' && req.url==='/api/health') return sendJson(res,200,{ok:true,emailConfigured:emailConfigured(),emailTo:process.env.WISH_TO_EMAIL||null});
  if(req.method==='POST' && req.url==='/api/wishes'){
    let body=''; req.on('data',chunk=>{body+=chunk;if(body.length>100000){sendJson(res,413,{error:'Wish is too large'});req.destroy()}});
    req.on('end',async()=>{try{
      const data=JSON.parse(body);const wish=String(data.wish||'').trim();
      if(!wish)return sendJson(res,400,{error:'Wish is empty'});
      if(wish.length>3000)return sendJson(res,413,{error:'Wish must be 3000 characters or fewer'});
      const entries=readWishes();const entry={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),wish,createdAt:new Date().toISOString()};
      entries.push(entry);fs.writeFileSync(store,JSON.stringify(entries,null,2));
      if(!emailConfigured())return sendJson(res,201,{...entry,emailConfigured:false,emailSent:false});
      try{await emailWish(entry);return sendJson(res,201,{...entry,emailConfigured:true,emailSent:true,emailTo:process.env.WISH_TO_EMAIL});}
      catch(err){console.error('Wish email failed:',err.message);return sendJson(res,201,{...entry,emailConfigured:true,emailSent:false,emailTo:process.env.WISH_TO_EMAIL,emailError:'Gmail SMTP rejected the message; check your Google App Password and Gmail security settings.'});}
    }catch(err){console.error(err);return sendJson(res,400,{error:'Invalid request or could not write wishes.json'});}});return;
  }
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return sendJson(res,400,{error:'Bad request'})}
  if(pathname==='/')pathname='/index.html';const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end('Forbidden')}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)});
});
const port=Number(process.env.PORT)||5501;
server.listen(port,'0.0.0.0',()=>{console.log(`Oyee... Sun Na. is running at http://localhost:${port}`);console.log(`Wish email: ${emailConfigured()?'configured for '+process.env.WISH_TO_EMAIL:'NOT configured — edit .env using .env.example'}`);console.log('Keep this window open while the website is in use.');});
