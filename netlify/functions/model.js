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

  if (event.httpMethod !== 'GET') {
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

    console.log('Testing connection to Fish Audio API...');
    
    const response = await axios({
      method: 'GET',
      url: `${FISH_AUDIO_API_BASE}/model`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });

    console.log(`Fish Audio API response: ${response.status}`);

    if (response.status !== 200) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Fish Audio API error',
          status: response.status,
          message: response.data
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Proxy server error',
        message: error.message
      })
    };
  }
};