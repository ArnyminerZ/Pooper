import {fetch} from "./db-utils.mjs";
import {translations} from "./translations.mjs";

/**
 * Gets the selected language for the given group.
 * @author Arnau Mora
 * @since 20230101
 * @param {import('sqlite3').Database} db The database to use.
 * @param {number} chatId The id of the chat making the request.
 * @return {Promise<string|null>} The language of the chat.
 */
export const getChatLanguage = async (db, chatId) => {
    /** @type {{Language:string}[]} */
    const result = await fetch(db, `SELECT Language FROM config WHERE ChatId=${chatId} LIMIT 1`);
    return result[0].Language;
};

/**
 * Gets a translated string from the given chat configuration.
 * @author Arnau Mora
 * @since 20230101
 * @param {import('sqlite3').Database} db The database to use.
 * @param {number} chatId The id of the chat making the request.
 * @param {LanguageKey} key The key of the translation to get.
 * @return {Promise<string>}
 */
export const getLocalizedString = async (db, chatId, key) => {
    const lang = await getChatLanguage(db, chatId) ?? 'en';
    return translations[lang][key];
};
