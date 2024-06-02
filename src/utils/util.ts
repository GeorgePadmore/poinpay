import * as bcrypt from 'bcrypt';
import * as moment from 'moment';

/**
 * Converts a string to a number.
 * @param {string} value - The string to convert.
 * @return {number} The converted number.
*/
export function toNumber(value: string): number {
    return parseInt(value, 10);
}


/**
 * Converts a string to a boolean.
 * @param {string} value - The string to convert ('true' or 'false').
 * @return {boolean} The converted boolean.
 */
export function toBool(value: string): boolean {
    return value === 'true';
}


/**
 * Normalizes a port number.
 * @param {string} port - The port string to normalize.
 * @return {number} The normalized port number or the default port 5432 if invalid.
 */
export function normalizePort(port: string): number {
    const parsedPort = Number(port);
    return (Number.isInteger(parsedPort) && parsedPort >= 0) ? parsedPort : 5432;
}


/**
 * Compares a plaintext string with its hashed counterpart to determine if they match.
 * @param {string} val - The plaintext string to be compared.
 * @param {string} hashedVal - The hashed string to compare against.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the plaintext string matches the hashed string.
 */
export async function verifyHashedString(val: string, hashedVal: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(val, hashedVal);
    return isMatch;
}


/**
 * Hashes a plaintext string.
 * @param {string} val - The plaintext string to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed string.
 */
export async function hashString(val: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    const hashedVal = await bcrypt.hash(val, salt);
    return hashedVal;
}


/**
 * Retrieves the current date and time.
 * @returns {Date} A JavaScript Date object representing the current date and time.
 */
export function currentDateTime(){
    return moment().toDate();
}


/**
 * Processes pagination parameters, setting defaults if not provided.
 * @param {{ page?: number, limit?: number }} data - An object containing pagination parameters.
 * @returns {{ limit: number, page: number }} An object containing processed pagination parameters (limit and page).
 */
export function processPagination(data: {page?: number, limit?: number}){
    const limit = (data.limit === null || data.limit === undefined) ? 10 : data.limit;
    const page = (data.page === null || data.page === undefined) ? 1 : data.page;
    return {limit, page};
}

/**
 * Represents different types of wallet transactions.
 * @enum {string}
 */
export enum WalletTransType {
    InitiateWallet = "AO", //Account Opening
    CreditWallet = "DP", // Account Deposit
    Transfer = "OT", //Outbound Transfer
    Receive = "IT", //Inbound Transfer
}