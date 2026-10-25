/**
 * Offline-capable password hashing using the Web Crypto API (SHA-256).
 * Available in all modern browsers, works without any network connection.
 * 
 * NOTE: SHA-256 is used here to prevent casual plain-text exposure in
 * localStorage. It is NOT bcrypt — server-side auth still uses Supabase.
 */
export async function hashPassword(password) {
  if (!password) return '';
  try {
    const msgBuffer = new TextEncoder().encode(String(password));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: obfuscate if Web Crypto unavailable (very old browsers)
    return btoa(encodeURIComponent(String(password)));
  }
}

export async function verifyPassword(plaintext, storedHash) {
  if (!plaintext || !storedHash) return false;
  // Support legacy plain-text passwords during migration
  if (storedHash === plaintext) return true;
  const hashed = await hashPassword(plaintext);
  return hashed === storedHash;
}

/**
 * Validates email format with a standard regex.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim());
}

/**
 * Validates password strength.
 * Rules: min 8 chars, at least 1 uppercase, 1 digit, 1 special character.
 * Returns { valid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (e.g. @, #, !).' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates an Indian mobile phone number.
 * Accepts: 10 digits, +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX
 */
export function isValidIndianPhone(phone) {
  const cleaned = (phone || '').replace(/[\s\-()]/g, '');
  return /^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
}
