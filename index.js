const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = "7893322030:AAET-QQcaYLDe_KJu1dGWAvcggJVxHujLeM";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const adminChatIds = ['978702643', '6391185835'];

app.post("/api/bot", async (req, res) => {
  try {
    const update = req.body;
    if (!update.message) return res.sendStatus(200);

    const message = update.message;
    const fromId = message.from.id;

    if (
      adminChatIds.includes(fromId.toString()) &&
      message.reply_to_message &&
      message.reply_to_message.forward_from
    ) {
      const userId = message.reply_to_message.forward_from.id;

      if (message.text) {
        await sendMessage(userId, message.text);
      } else if (message.photo) {
        const photo = message.photo[message.photo.length - 1].file_id;
        const caption = message.caption || "";
        await sendPhoto(userId, photo, caption);
      }
    } else {
      const chatId = message.chat.id;
      const msgId = message.message_id;

      for (const adminId of adminChatIds) {
        await forwardMessage(adminId, chatId, msgId);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error in bot:", err);
    res.sendStatus(500);
  }
});

async function sendMessage(chatId, text) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text,
  });
}

async function sendPhoto(chatId, fileId, caption = "") {
  await axios.post(`${TELEGRAM_API}/sendPhoto`, {
    chat_id: chatId,
    photo: fileId,
    caption,
  });
}

async function forwardMessage(toChatId, fromChatId, messageId) {
  await axios.post(`${TELEGRAM_API}/forwardMessage`, {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

// Vercel expects the app to be exported (not app.listen)
module.exports = app;
