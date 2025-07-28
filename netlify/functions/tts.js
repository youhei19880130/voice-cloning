const axios = require('axios');

const FISH_AUDIO_API_BASE = 'https://api.fish.audio';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // OPTIONS リクエスト（プリフライト）への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header is required' })
      };
    }

    const requestBody = JSON.parse(event.body);
    console.log('TTS request:', requestBody);

    const response = await axios({
      method: 'POST',
      url: `${FISH_AUDIO_API_BASE}/v1/tts`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      data: requestBody,
      responseType: 'arraybuffer',
      validateStatus: () => true
    });

    console.log(`TTS API response status: ${response.status}`);

    if (response.status !== 200) {
      console.error(`TTS API error: ${response.status}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Fish Audio TTS API error',
          status: response.status,
          message: response.data.toString()
        })
      };
    }

    // 音声データをBase64エンコード
    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    console.log(`Audio data size: ${response.data.length} bytes`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg'
      },
      body: audioBase64,
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('TTS Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'TTS Proxy server error',
        message: error.message
      })
    };
  }
};