import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy route for Xtream Codes API
  app.post("/api/proxy", async (req, res) => {
    try {
      const { url, method = 'GET', data, params } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await axios({
        url,
        method,
        data,
        params,
        // Don't validate status to pass errors through
        validateStatus: () => true,
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).json({ error: "Proxy request failed" });
    }
  });

  // Proxy route for Video Streams (HLS/TS/MP4) to bypass CORS and Mixed Content
  app.get("/proxy-stream/:encodedHost/*", async (req, res) => {
    let targetUrl = "";
    try {
      const encodedHost = req.params.encodedHost;
      const pathParam = req.params[0];
      
      const host = Buffer.from(encodedHost, 'base64').toString('utf-8').replace(/\/$/, '');
      targetUrl = `${host}/${pathParam}`;
      
      console.log(`[Proxy] Streaming: ${targetUrl}`);

      const urlObj = new URL(targetUrl);
      for (const [key, value] of Object.entries(req.query)) {
        urlObj.searchParams.append(key, value as string);
      }

      const isM3u8 = urlObj.pathname.endsWith('.m3u8');

      // Use a more robust header set
      const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await axios({
        method: 'GET',
        url: urlObj.toString(),
        responseType: isM3u8 ? 'text' : 'stream',
        validateStatus: () => true,
        headers,
        timeout: 60000, // 60 seconds timeout for streams
        maxRedirects: 5,
        decompress: false, // Don't decompress to keep the stream raw
      });

      // Handle client disconnect
      res.on('close', () => {
        if (response.data && typeof response.data.destroy === 'function') {
          response.data.destroy();
        }
      });

      // Forward status code
      res.status(response.status);
      
      // Forward relevant headers
      const headersToForward = [
        'content-type', 
        'content-length', 
        'content-range', 
        'accept-ranges', 
        'cache-control',
        'expires',
        'last-modified',
        'content-disposition'
      ];

      let contentType = response.headers['content-type'];
      // Force content-type for .ts files if missing or generic
      if (pathParam.endsWith('.ts') && (!contentType || contentType === 'application/octet-stream' || contentType === 'text/plain')) {
        contentType = 'video/mp2t';
      }

      for (const [key, value] of Object.entries(response.headers)) {
        if (headersToForward.includes(key.toLowerCase()) && value) {
          if (isM3u8 && key.toLowerCase() === 'content-length') continue;
          if (key.toLowerCase() === 'content-type') {
            res.setHeader(key, contentType as string);
          } else {
            res.setHeader(key, value as string);
          }
        }
      }

      // Always allow CORS for the proxy
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

      if (isM3u8) {
        let manifest = response.data as string;
        // Rewrite absolute URLs in the manifest to point back to our proxy
        manifest = manifest.split('\n').map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
            try {
              const lineUrl = new URL(trimmedLine);
              const lineHost = lineUrl.origin;
              const linePath = lineUrl.pathname.substring(1) + lineUrl.search;
              const lineEncodedHost = Buffer.from(lineHost).toString('base64');
              return `/proxy-stream/${lineEncodedHost}/${linePath}`;
            } catch (e) {
              return line;
            }
          }
          return line;
        }).join('\n');
        res.send(manifest);
      } else {
        // For binary streams, pipe the data directly
        response.data.pipe(res);
        
        // Handle client disconnect
        req.on('close', () => {
          if (response.data && typeof response.data.destroy === 'function') {
            response.data.destroy();
          }
        });
      }
    } catch (error: any) {
      console.error(`Stream proxy error for ${targetUrl}:`, error.message);
      if (!res.headersSent) {
        res.status(500).send("Stream proxy error: " + error.message);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
