
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Firebase Admin SDK тохируулах
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}
const db = admin.database();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      bot.processUpdate(req.body);
 development and debugging
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }

  // /start тушаал
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'BallonyUp P2E тоглоомын ботод тавтай морил! /score, /tokens, /leaderboard ашиглана уу.', {
      reply_markup: {
        keyboard: [['Оноо харах'], ['Токен харах'], ['Leaderboard']],
        resize_keyboard: true,
      },
    });
  });

  // Оноо харах
  bot.onText(/\/score|Оноо харах/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    try {
      const snapshot = await db.ref('users/' + userId).once('value');
      if (snapshot.exists()) {
        bot.sendMessage(chatId, `Таны оноо: ${Math.floor(snapshot.val().score || 0)}`);
      } else {
        bot.sendMessage(chatId, 'Оноо олдсонгүй. Тоглоомоо тоглоод /saveScore ашиглана уу.');
      }
    } catch (error) {
      bot.sendMessage(chatId, 'Алдаа: ' + error.message);
    }
  });

  // Токен харах
  bot.onText(/\/tokens|Токен харах/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    try {
      const snapshot = await db.ref('users/' + userId).once('value');
      if (snapshot.exists()) {
        bot.sendMessage(chatId, `Таны токен: ${snapshot.val().tokens || 0}`);
      } else {
        bot.sendMessage(chatId, 'Токен олдсонгүй.');
      }
    } catch (error) {
      bot.sendMessage(chatId, 'Алдаа: ' + error.message);
    }
  });

  // Оноо хадгалах
  bot.onText(/\/saveScore (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const score = parseInt(match[1]);
    try {
      await db.ref('users/' + userId).update({
        username: msg.from.username || 'Unknown',
        score,
        lastPlayed: new Date().toISOString(),
      });
      bot.sendMessage(chatId, `Таны оноо ${score} амжилттай хадгалагдлаа!`);
    } catch (error) {
      bot.sendMessage(chatId, 'Алдаа: ' + error.message);
    }
  });

  // Токен нэмэх
  bot.onText(/\/addTokens (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const tokens = parseInt(match[1]);
    try {
      const snapshot = await db.ref('users/' + userId).once('value');
      const currentTokens = snapshot.exists() ? snapshot.val().tokens || 0 : 0;
      await db.ref('users/' + userId).update({
        username: msg.from.username || 'Unknown',
        tokens: currentTokens + tokens,
        lastPlayed: new Date().toISOString(),
      });
      await db.ref('transactions').push({
        userId,
        amount: tokens,
        type: 'earned',
        timestamp: new Date().toISOString(),
      });
      bot.sendMessage(chatId, `Танд ${tokens} токен нэмэгдлээ! /tokens-оор шалгана уу.`);
    } catch (error) {
      bot.sendMessage(chatId, 'Алдаа: ' + error.message);
    }
  });

  // Leaderboard
  bot.onText(/\/leaderboard|Leaderboard/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const snapshot = await db.ref('users').orderByChild('score').limitToLast(10).once('value');
      let leaderboard = 'Leaderboard:\n';
      snapshot.forEach((child) => {
        const data = child.val();
        leaderboard = `${data.username}: ${Math.floor(data.score || 0)} оноо, ${data.tokens || 0} токен\n` + leaderboard;
      });
      bot.sendMessage(chatId, leaderboard || 'Leaderboard хоосон байна.');
    } catch (error) {
      bot.sendMessage(chatId, 'Алдаа: ' + error.message);
    }
  });
};