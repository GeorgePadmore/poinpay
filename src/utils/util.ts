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


export async function verifyHashedString(val: string, hashedVal: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(val, hashedVal);
    return isMatch;
}


export async function hashString(val: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    const hashedVal = await bcrypt.hash(val, salt);
    return hashedVal;
}

export function currentDateTime(){
    return moment().toDate();
}


export enum WalletTransType {
    InitiateWallet = "IWT", //Initiate Wallet
    CreditWallet = "CWT", // Credit Wallet
    Transfer = "TNF",
  }