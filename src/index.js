const config = {
  channelAccessToken:
    "ET1y0ckeqdHOhGH0lFKFLEv1f8rDTZBSQ68PnyJ8XiQ/TkdZObUp2eE5fwzzWENerdkiYhXjvhwUfgA09XO9/ERO2UsSVbTHU474Ps+VlaxWADiZhaeW46FtHDKDkxbJ5xc6iWXHJO/ZbFkcldoB9wdB04t89/1O/w1cDnyilFU=", // LINE Developersから取得
  channelSecret: "eea04a8bd8cf104f3ba4f39cdb8e5388", // LINE Developersから取得
};

import { Hono } from 'hono';

// Honoアプリケーションを初期化
const app = new Hono();

/**
 * =============================================
 * LINE署名を検証するHonoミドルウェア
 * =============================================
 */
app.use('/webhook', async (c, next) => {
  // リクエストのボディは一度しか読み取れないため、クローンして検証に使う
  const body = await c.req.raw.clone().text(); 
  const signature = c.req.header('x-line-signature');

  if (!signature) {
    return c.text('Signature not found', 400);
  }

  // Web Crypto APIを使って署名を検証
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(c.env.CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));

  // 署名が一致しない場合は401エラーを返す
  if (hash !== signature) {
    return c.text('Invalid signature', 401);
  }

  // 検証が成功したら次の処理へ
  await next();
});


/**
 * =============================================
 * Webhookのメイン処理
 * =============================================
 */
app.post('/webhook', async (c) => {
  try {
    const data = await c.req.json();
    const events = data.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const replyText = `JS版Honoからの返信: 「${event.message.text}」`;
        
        // メッセージを返信
        await replyMessage(c.env.CHANNEL_ACCESS_TOKEN, event.replyToken, replyText);
      }
    }
  } catch (error) {
    console.error(error);
    return c.text('Internal Server Error', 500);
  }

  return c.text('OK');
});

/**
 * =============================================
 * ヘルパー関数: メッセージ返信
 * =============================================
 */
async function replyMessage(accessToken, replyToken, text) {
  const apiUrl = 'https://api.line.me/v2/bot/message/reply';
  await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }],
    }),
  });
}

// Honoアプリケーションをエクスポート
export default app;