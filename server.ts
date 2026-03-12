import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/proxy", async (req, res) => {
    try {
      const { url, method = 'GET', data, params } = req.body;
      const response = await axios({
        url,
        method,
        data,
        params,
        headers: { 'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18' },
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Proxy failed" });
    }
  });

  app.get("/proxy-stream/:encodedHost/*", async (req, res) => {
    try {
      const encodedHost = req.params.encodedHost;
      const pathParam = req.params[0];
      const host = Buffer.from(encodedHost, 'base64').toString('utf-8').replace(/\/$/, '');
      const targetUrl = `${host}/${pathParam}`;

      const urlObj = new URL(targetUrl);
      for (const [key, value] of Object.entries(req.query)) {
        urlObj.searchParams.append(key, value as string);
      }

      const response = await axios({
        method: 'GET',
        url: urlObj.toString(),
        responseType: 'stream',
        validateStatus: () => true,
        headers: {
          // FORÇANDO User-Agent de Player Real para ignorar proteção HTML
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
          'Accept': '*/*',
          'Icy-MetaData': '1',
          'Connection': 'keep-alive',
          'Range': req.headers.range || 'bytes=0-'
        },
        timeout: 60000,
      });

      // Se o servidor ainda mandar HTML, forçamos o tipo de conteúdo para vídeo
      let contentType = response.headers['content-type'];
      if (pathParam.endsWith('.mp4') || contentType?.includes('text/html')) {
        contentType = 'video/mp4';
      }

      res.status(response.status);
      
      const headersToForward = ['content-length', 'content-range', 'accept-ranges'];
      for (const [key, value] of Object.entries(response.headers)) {
        if (headersToForward.includes(key.toLowerCase()) && value) {
          res.setHeader(key, value as string);
        }
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');

      response.data.pipe(res);

      req.on('close', () => {
        if (response.data && typeof response.data.destroy === 'function') response.data.destroy();
      });
    } catch (error) {
      if (!res.headersSent) res.status(500).send("Stream error");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();