// 必要なライブラリを読み込む
const express = require('express');
const line = require('@line/bot-sdk');

// ----------------------------------------------------------------
// ↓↓↓ あなたのBOTの情報をここに入力してください ↓↓↓
// ----------------------------------------------------------------
const config = {
  channelAccessToken: 'ET1y0ckeqdHOhGH0lFKFLEv1f8rDTZBSQ68PnyJ8XiQ/TkdZObUp2eE5fwzzWENerdkiYhXjvhwUfgA09XO9/ERO2UsSVbTHU474Ps+VlaxWADiZhaeW46FtHDKDkxbJ5xc6iWXHJO/ZbFkcldoB9wdB04t89/1O/w1cDnyilFU=', // LINE Developersから取得
  channelSecret: 'eea04a8bd8cf104f3ba4f39cdb8e5388',        // LINE Developersから取得
};

// 影モードで使うアイコンのURL
const SHADOW_ICON_URL = 'https://imgur.com/a/NlbRQjY#WD3ZL5e'; // ← 【重要】あなたの正しい画像URLに書き換えてください！
// ----------------------------------------------------------------

// ExpressとLINEクライアントを初期化
const app = express();
const client = new line.Client(config);

// Webhookを受け取るためのエンドポイントを設定
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// メインの処理を行う関数
function handleEvent(event) {
  // テキストメッセージ以外や、自分からのメッセージは無視
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text; // ユーザーが送ってきたメッセージ
  const replyToken = event.replyToken;   // 返信するためのトークン

  console.log('ユーザーからのメッセージ:', userMessage);

  // --- ✨ここからモード切替のロジック ---
  // もしユーザーのメッセージに「相談」という言葉が含まれていたら影モードで返信する
  if (userMessage.includes('相談')) {
    // 影モード用のメッセージを作成
    const shadowMessage = {
      type: 'text',
      text: '……なに？ 聞くだけなら、聞いてあげる。',
      sender: {
        name: '???',
        iconUrl: SHADOW_ICON_URL
      }
    };
    // 影モードで返信
    return client.replyMessage(replyToken, shadowMessage);
  } else {
    // それ以外のメッセージには、光モード（デフォルト）でランダムに返信する
    
    // 1. 返信メッセージのリスト（配列）を作る
    const lightModeReplies = [
      'うんうん、それで？',
      'そうなんだ！！',
      'すごい！面白いね！',
      '今日の天気、晴れるといいな☀️',
      'お腹すいちゃったかも…',
      'なるほどねー！',
      'ほほう、難しい…',
    ];

    // 2. リストの中からランダムで1つ選ぶ
    const randomIndex = Math.floor(Math.random() * lightModeReplies.length);
    const randomMessage = lightModeReplies[randomIndex];

    // 3. 選んだメッセージを送信する形式に整える
    const lightMessage = {
      type: 'text',
      text: randomMessage,
    };
    
    // 4. 返信する
    return client.replyMessage(replyToken, lightMessage);
  }
}

// サーバーを起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`サーバーがポート${port}で起動しました`);
});