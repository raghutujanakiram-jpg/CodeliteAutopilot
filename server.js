import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory mock storage for table submissions (leads, subscribers)
const leads = [];
const subscribers = [];

app.post('/tables/leads', (req, res) => {
  const lead = {
    id: 'CL-' + Date.now().toString().slice(-6),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  leads.push(lead);
  res.status(201).json({ success: true, lead });
});

app.post('/tables/subscribers', (req, res) => {
  const sub = {
    id: 'SUB-' + Date.now().toString().slice(-6),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  subscribers.push(sub);
  res.status(201).json({ success: true, subscriber: sub });
});

// Clean URL support for top-level pages
app.get('/:page', (req, res, next) => {
  const pageFile = path.join(__dirname, `${req.params.page}.html`);
  res.sendFile(pageFile, (err) => {
    if (err) next();
  });
});

// Serve static assets from root directory
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Codelite AutoPilot server listening on http://0.0.0.0:${PORT}`);
});
