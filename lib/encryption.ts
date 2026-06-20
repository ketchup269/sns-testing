import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || ''
const PREFIX = 'enc:'

/**
 * Encrypts a string using AES-256-CBC.
 * If the DB_ENCRYPTION_KEY is missing or invalid, it returns the plain text to avoid breaking.
 * If the text is already encrypted, it returns the text as-is.
 */
export function encrypt(text: string | null | undefined): string | null | undefined {
    if (!text) return text
    if (text.startsWith(PREFIX)) return text // Already encrypted

    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
        console.warn('[Encryption] DB_ENCRYPTION_KEY is missing or invalid (must be 32 bytes hex). Storing as plaintext.')
        return text
    }

    try {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return `${PREFIX}${iv.toString('hex')}:${encrypted.toString('hex')}`
    } catch (e) {
        console.error('[Encryption] Failed to encrypt string:', e)
        return text // Fallback to plaintext if encryption fails
    }
}

/**
 * Decrypts a string previously encrypted with AES-256-CBC.
 * If the string does not have the encrypted prefix, it is returned as-is (graceful fallback for existing data).
 */
export function decrypt(text: string | null | undefined): string | null | undefined {
    if (!text || !text.startsWith(PREFIX)) return text // Plaintext fallback for unencrypted data

    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
        console.warn('[Encryption] DB_ENCRYPTION_KEY is missing or invalid. Cannot decrypt.')
        return text
    }

    try {
        const parts = text.slice(PREFIX.length).split(':')
        if (parts.length !== 2) return text // Invalid format
        const iv = Buffer.from(parts[0], 'hex')
        const encryptedText = Buffer.from(parts[1], 'hex')
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
        let decrypted = decipher.update(encryptedText)
        decrypted = Buffer.concat([decrypted, decipher.final()])
        return decrypted.toString()
    } catch (e) {
        console.error('[Encryption] Failed to decrypt string:', e)
        return text // Return encrypted string if decryption fails (or empty? returning original is safer)
    }
}
