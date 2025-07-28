# Fish Audio リアルタイム音声読み上げアプリ

Fish Audio APIを使用して、キーボード入力をリアルタイムで音声読み上げするReactアプリケーションです。

## 機能

- Fish Audio WebSocket APIとの接続
- キーボード入力のリアルタイム音声読み上げ
- 指定したモデルIDでの音声生成
- 音声再生状況の表示
- 接続ログの表示

## 使用方法

### ローカル開発環境

1. 依存関係をインストール:
```bash
npm install
```

2. プロキシサーバーとReactアプリを同時起動:
```bash
npm run dev
```

または、別々に起動する場合:
```bash
# ターミナル1: プロキシサーバー起動
npm run server

# ターミナル2: Reactアプリ起動  
npm start
```

3. ブラウザで `http://localhost:3000` にアクセス

### Netlifyデプロイ

1. Netlifyアカウントにログイン
2. GitHubリポジトリと連携
3. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `build`
4. デプロイ完了後、URLにアクセス

## 使用手順

1. Fish Audio APIキーを入力して「接続テスト」をクリック
2. 接続成功後、テキストエリアに文字を入力してEnterキーを押すと音声読み上げされます

## 重要な注意点

- **ローカル開発**: プロキシサーバー（ポート3001）とReactアプリ（ポート3000）の両方が起動している必要があります
- **本番環境**: Netlify Functionsが自動的にプロキシ機能を提供します
- CORSエラーを回避するため、プロキシ経由でFish Audio APIにアクセスします

## 必要なもの

- Fish Audio APIキー (https://fish.audio/go-api/ で取得)
- モダンブラウザ（WebSocket、Web Audio API対応）

## 技術仕様

- React 18 + TypeScript
- Fish Audio WebSocket API
- Web Audio API for 音声再生
- モデルID: 0d1f38e6c3fe415d9c79583d6781774b

## 注意事項

- APIキーは安全に管理してください
- ブラウザの音声再生許可が必要です
- WebSocket接続が必要です