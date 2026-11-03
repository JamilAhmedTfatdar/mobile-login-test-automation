// Loads the test data file so specs never hard-code emails, passwords or messages.

import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('./users.json', import.meta.url), 'utf8'));

export const users = data.users;
export const wrongPasswords = data.wrongPasswords;
export const newPassword = data.newPassword;
export const messages = data.messages;
