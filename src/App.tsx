import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// 開発環境とプロダクション環境で異なるAPI baseを使用
const PROXY_API_BASE = process.env.NODE_ENV === 'production' 
  ? '/proxy' 
  : 'http://localhost:3001/api';
const MODEL_ID = '0d1f38e6c3fe415d9c79583d6781774b';

interface TTSRequest {
  text: string;
  reference_id?: string;
  format?: string;
  normalize?: boolean;
  mp3_bitrate?: number;
  opus_bitrate?: number;
  latency?: string;
}

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  }, []);

  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  const playAudioData = useCallback(async (audioData: ArrayBuffer) => {
    try {
      await initAudioContext();
      
      if (!audioContextRef.current) return;
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      addLog('音声再生開始');
    } catch (error) {
      console.error('音声再生エラー:', error);
      addLog(`音声再生エラー: ${error}`);
      setIsPlaying(false);
    }
  }, [initAudioContext, addLog]);

  const testConnection = useCallback(async () => {
    if (!apiKey.trim()) {
      addLog('APIキーを入力してください');
      return;
    }

    try {
      addLog('Fish Audio APIとの接続をテストしています...');
      
      // APIキーの有効性をテスト
      const response = await fetch(`${PROXY_API_BASE}/model`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsConnected(true);
        addLog('Fish Audio APIに正常に接続しました');
      } else {
        const errorText = await response.text();
        addLog(`接続エラー: ${response.status} - ${errorText}`);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('接続エラー:', error);
      addLog(`接続エラー: ${error}`);
      setIsConnected(false);
    }
  }, [apiKey, addLog]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    addLog('切断しました');
  }, [addLog]);

  const sendTextToTTS = useCallback(async (textToSend: string) => {
    if (!isConnected || !textToSend.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    addLog(`音声生成中: "${textToSend}"`);

    try {
      const ttsRequest: TTSRequest = {
        text: textToSend,
        reference_id: MODEL_ID,
        format: 'mp3',
        normalize: true,
        mp3_bitrate: 128,
        latency: 'normal'
      };

      const response = await fetch(`${PROXY_API_BASE}/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ttsRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      await playAudioData(audioData);
      addLog(`音声生成完了: "${textToSend}"`);
    } catch (error) {
      console.error('TTS エラー:', error);
      addLog(`TTS エラー: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isLoading, apiKey, playAudioData, addLog]);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    
    // 改行が入力された場合、その行を読み上げ
    if (value.includes('\n')) {
      const lines = value.split('\n');
      const lastLine = lines[lines.length - 2]; // 改行前の行
      
      if (lastLine && lastLine.trim()) {
        sendTextToTTS(lastLine.trim());
      }
      
      // テキストエリアをクリア（オプション）
      setText('');
    }
  }, [sendTextToTTS]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentText = text.trim();
      if (currentText) {
        sendTextToTTS(currentText);
        setText('');
      }
    }
  }, [text, sendTextToTTS]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fish Audio リアルタイム音声読み上げ</h1>
        <p>モデルID: {MODEL_ID}</p>
      </header>

      <main className="app-main">
        <div className="connection-section">
          <div className="api-key-input">
            <label htmlFor="apiKey">Fish Audio APIキー:</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="APIキーを入力してください"
              disabled={isConnected}
            />
          </div>
          
          <div className="connection-controls">
            {!isConnected ? (
              <button onClick={testConnection} disabled={!apiKey.trim()}>
                接続テスト
              </button>
            ) : (
              <button onClick={disconnect}>
                切断
              </button>
            )}
            <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
        </div>

        <div className="text-input-section">
          <label htmlFor="textInput">テキスト入力（Enterで読み上げ）:</label>
          <textarea
            id="textInput"
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ここに文字を入力してEnterキーを押すと読み上げます..."
            disabled={!isConnected}
            rows={4}
          />
          
          <div className="playback-status">
            {isLoading && <span className="loading-indicator">⏳ 音声生成中...</span>}
            {isPlaying && <span className="playing-indicator">🔊 再生中...</span>}
          </div>
        </div>

        <div className="logs-section">
          <h3>ログ</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;