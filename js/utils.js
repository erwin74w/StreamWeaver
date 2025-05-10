// js/utils.js
import { DEBUG } from './ably-config.js'; // Import DEBUG

const LOG_PREFIX = "[Utils]";
const logger = {
    // log: (...args) => DEBUG && console.log(LOG_PREFIX, ...args), // Not used in this file currently
    error: (...args) => console.error(LOG_PREFIX, ...args),
};

/**
 * Fetches JSON data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @param {string} [defaultMessage="Overlay Ready"] - Default message if fetch fails or data is malformed.
 * @returns {Promise<string>} - The message from the fetched data or a default/error message.
 */
export async function fetchOverlayData(url, defaultMessage = "Overlay Ready") {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data?.message || defaultMessage;
    } catch (error) {
        logger.error(`Error fetching ${url}:`, error);
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return `Error loading data (${fileName})`;
    }
}
