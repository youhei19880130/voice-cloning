import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // プロキシ対象のパスを確認
  if (!pathname.startsWith('/proxy/')) {
    return new Response('Not found', { status: 404 });
  }

  // CORS ヘッダーを設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // OPTIONS リクエスト（プリフライト）への対応
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Fish Audio API のエンドポイントにマッピング
    let targetUrl: string;
    if (pathname === '/proxy/model') {
      targetUrl = 'https://api.fish.audio/model';
    } else if (pathname === '/proxy/tts') {
      targetUrl = 'https://api.fish.audio/v1/tts';
    } else {
      return new Response('Invalid endpoint', { status: 404 });
    }

    // リクエストヘッダーを取得
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }

    // Fish Audio API にリクエストを転送
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? await request.text() : null,
    });

    // レスポンスヘッダーを設定
    const responseHeaders = new Headers(corsHeaders);
    
    // Fish Audio API からのレスポンスヘッダーをコピー
    for (const [key, value] of response.headers.entries()) {
      if (!key.toLowerCase().startsWith('access-control-')) {
        responseHeaders.set(key, value);
      }
    }

    // レスポンスボディを取得
    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
};