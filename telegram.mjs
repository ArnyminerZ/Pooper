import {fetch} from './db-utils.mjs';

/**
 *
 * @param {import('node-telegram-bot-api')} bot The bot instance.
 * @param {Map<number, Map<number, number>>} countMap The counter map.
 * @returns {Promise<void>}
 */
export const updateDescription = async (bot, countMap) => {
    for (const chatId of countMap.keys()) {
        const usersMap = countMap.get(chatId);
        const desc = ['💩 POOPER 💩'];

        for (const userId of usersMap.keys()) {
            const count = usersMap.get(userId);
            const member = await bot.getChatMember(chatId, userId.toString());
            const user = member.user;

            if (user.is_bot === true) return;

            desc.push(`- ${user.username}: ${count}`);
        }

        const chat = await bot.getChat(chatId);
        const description = desc.join('\n');
        if (chat.description !== description)
            await bot.setChatDescription(chatId, description);
    }
};

/**
 * Updates the counter according to the db contents.
 * @author Arnau Mora
 * @since 20230101
 * @param {import('sqlite3').Database} db The database to use.
 * @param {Map<number, Map<number, number>>} count The count map to be updated.
 * @returns {Promise<void>}
 */
export const updateCount = async (db, count) => {
    count.clear();

    console.info('Querying data from database...');
    /** @type {Row[]} */
    const dbResult = await fetch(db, 'SELECT * FROM poops;')
    for (const row of dbResult) {
        const timestampDate = new Date(row.Timestamp.replace(' ', 'T') + '.000Z');
        const timestamp = timestampDate.getTime();
        const userId = row.UserId;
        const chatId = row.ChatId;

        /** @type {{CountFrom:number}[]} */
        const configRows = await fetch(db, `SELECT CountFrom FROM config WHERE ChatId=${row.ChatId} LIMIT 1;`);
        const countFrom = configRows.length <= 0 ? 0 : configRows[0].CountFrom;

        if (countFrom > timestamp) continue;

        const chat = count.get(chatId) ?? (new Map());
        const userCount = chat.get(userId) ?? 0;

        chat.set(userId, userCount + 1);
        count.set(chatId, chat);
    }

    console.info(`Got`, count.size, 'chats. Updating descriptions...');
};
