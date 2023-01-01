import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

import {__dirname} from "./utils.mjs";
import {updateCount, updateDescription} from "./telegram.mjs";
import {fetch, query} from './db-utils.mjs';
import {getLocalizedString} from "./locale.mjs";

dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

const token = process.env['TOKEN'];
const bot = new TelegramBot(token, {polling: true});

/**
 * @typedef {Object} Row
 * @property {number} ChatId The id of the chat where the message was sent.
 * @property {number} UserId The id of the user that sent the message.
 * @property {string} Timestamp The timestamp of the moment at which the message was sent.
 */

console.info('Creating tables...');
db.run(`CREATE TABLE IF NOT EXISTS poops (
    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ChatId INTEGER NOT NULL,
    UserId INTEGER NOT NULL,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
db.run(`CREATE TABLE IF NOT EXISTS config (
    ChatId INTEGER NOT NULL,
    Language TEXT NOT NULL DEFAULT 'en',
    CountFrom INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ChatId)
)`);

/** @type {Map<number, Map<number, number>>} */
const count = new Map();

(async () => {
    await bot.setMyCommands([{command: 'poop_reset', description: 'Resets the poop counter for the current chat.'}]);

    await updateCount(db, count);

    for (const chatId of count.keys()) {
        const rows = await fetch(db, `SELECT * FROM config WHERE ChatId=${chatId} LIMIT 1;`);
        if (rows.length <= 0)
            await query(db, `INSERT INTO config (ChatId) VALUES (${chatId})`);
    }

    await updateDescription(bot, count);

    console.info('Adding event listeners...');
    bot.onText(/\/poop_reset/, async (message) => {
        const chatId = message.chat.id;

        const now = new Date();
        await query(db, `UPDATE config SET CountFrom=${now.getTime()} WHERE ChatId=${chatId}`);
        await updateCount(db, count);
        await bot.setChatDescription(chatId, '');

        const text = await getLocalizedString(db, chatId, 'reset');
        await bot.sendMessage(chatId, text);
    });
    bot.on('message', async (/** @type {TelegramBot.Message} */ message) => {
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;

        if (text !== '💩') return;

        await query(db, `INSERT INTO poops (ChatId, UserId) VALUES (${chatId}, ${userId})`);

        await updateCount(db, count);
        await updateDescription(bot, count);
    });
})();
