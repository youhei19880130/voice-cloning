const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Fish Audio API のベースURL
const FISH_AUDIO_API_BASE = 'https://api.fish.audio';

// モデル一覧取得（接続テスト用）
app.get('/api/model', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    console.log('Testing connection to Fish Audio API...');
    
    const response = await axios({
      method: 'GET',
      url: `${FISH_AUDIO_API_BASE}/model`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // すべてのHTTPステータスを許可
    });

    console.log(`Fish Audio API response: ${response.status} - ${JSON.stringify(response.data).substring(0, 200)}...`);

    if (response.status !== 200) {
      return res.status(response.status).json({
        error: 'Fish Audio API error',
        status: response.status,
        message: response.data
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy server error',
      message: error.message
    });
  }
});

// TTS API
app.post('/api/tts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    console.log('TTS request:', req.body);

    const response = await axios({
      method: 'POST',
      url: `${FISH_AUDIO_API_BASE}/v1/tts`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      data: req.body,
      responseType: 'arraybuffer', // バイナリデータ用
      validateStatus: () => true
    });

    console.log(`TTS API response status: ${response.status}`);

    if (response.status !== 200) {
      console.error(`TTS API error: ${response.status} - ${response.data}`);
      return res.status(response.status).json({
        error: 'Fish Audio TTS API error',
        status: response.status,
        message: response.data.toString()
      });
    }

    // 音声データを取得してクライアントに転送
    const audioData = Buffer.from(response.data);
    
    console.log(`Audio data size: ${audioData.length} bytes`);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioData.length
    });
    
    res.send(audioData);
  } catch (error) {
    console.error('TTS Proxy error:', error);
    res.status(500).json({
      error: 'TTS Proxy server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log('  GET  /api/model - Test Fish Audio API connection');
  console.log('  POST /api/tts   - Text-to-Speech via Fish Audio API');
});