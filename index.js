// index.js
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Bot token (hardcoded)
const BOT_TOKEN = "7893322030:AAEjS_TbKslgdl6iVrhDQ-atnufHZ95KkO0";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// List of admin chat IDs
const adminChatIds = ['978702643', '6391185835'];

app.post("/api/bot", async (req, res) => {
  const update = req.body;
  if (!update.message) return res.sendStatus(200);

  const message = update.message;
  const fromId = message.from.id;

  // Admin replying to forwarded message
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
    // Forward normal user message to all admins
    const chatId = message.chat.id;
    const msgId = message.message_id;

    for (const adminId of adminChatIds) {
      await forwardMessage(adminId, chatId, msgId);
    }
  }

  res.sendStatus(200);
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

module.exports = app;
