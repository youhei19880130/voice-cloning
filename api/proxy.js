const https = require('https');
const { URL } = require('url');

module.exports = async (req, res) => {
  // CORS ヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS リクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    // Fish Audio API のエンドポイントにマッピング
    let targetUrl;
    if (endpoint === 'model') {
      targetUrl = 'https://api.fish.audio/model';
    } else if (endpoint === 'tts') {
      targetUrl = 'https://api.fish.audio/v1/tts';
    } else {
      return res.status(404).json({ error: 'Invalid endpoint' });
    }

    // リクエストヘッダーを準備
    const headers = {
      'Content-Type': 'application/json',
    };

    // Authorization ヘッダーがある場合は追加
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const options = {
      method: req.method,
      headers: headers,
    };

    // リクエストボディがある場合は追加
    let requestBody = '';
    if (req.method !== 'GET' && req.body) {
      requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    // Fish Audio API にリクエストを送信
    const targetUrlObj = new URL(targetUrl);
    const requestOptions = {
      hostname: targetUrlObj.hostname,
      port: targetUrlObj.port || 443,
      path: targetUrlObj.pathname,
      method: req.method,
      headers: headers,
    };

    const proxyReq = https.request(requestOptions, (proxyRes) => {
      // レスポンスヘッダーを設定
      res.status(proxyRes.statusCode);
      
      // Content-Type をコピー
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }

      // レスポンスボディを転送
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({
        error: 'Proxy request failed',
        message: error.message
      });
    });

    // リクエストボディがある場合は送信
    if (requestBody) {
      proxyReq.write(requestBody);
    }

    proxyReq.end();
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};