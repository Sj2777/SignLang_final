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
 * Set of known disposable, temporary, dummy, and test domains.
 */
const BLOCKED_DOMAINS = new Set([
  'test.com', 'test.in', 'test.org', 'test.net', 'test.co', 'test.io',
  'testing.com', 'testing.org',
  'example.com', 'example.org', 'example.net', 'example.edu',
  'sample.com', 'sample.org', 'sample.net',
  'fake.com', 'fake.org', 'fake.net', 'fakemail.com',
  'dummy.com', 'dummy.org', 'dummy.net',
  'temp.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'mailinator.com', 'guerrillamail.com', 'trashmail.com', 'throwaway.com',
  'yopmail.com', 'xyz.com', 'abc.com', 'foo.com', 'bar.com', 'none.com',
  'dispostable.com', 'maildrop.cc', 'sharklasers.com', 'getairmail.com'
]);

/**
 * Thorough email validation:
 * 1. Checks standard RFC syntax.
 * 2. Checks mailbox prefix length (at least 2 chars).
 * 3. Rejects dummy/test/disposable domains (e.g. test.com, fake.com, example.com).
 * 4. Ensures domain has a valid TLD of at least 2 alpha characters.
 * Returns { valid: boolean, message: string }
 */
export function validateEmail(email) {
  const raw = (email || '').trim();
  if (!raw) {
    return { valid: false, message: 'Email address cannot be empty.' };
  }

  // Basic structure check
  if (!raw.includes('@')) {
    return { valid: false, message: 'Email must contain an "@" symbol.' };
  }

  const parts = raw.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Email can only contain one "@" symbol.' };
  }

  const [localPart, domainPart] = parts;

  // Local part (before @)
  if (!localPart || localPart.length < 2) {
    return { valid: false, message: 'Email username must be at least 2 characters before "@".' };
  }
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) {
    return { valid: false, message: 'Email username contains invalid characters.' };
  }
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, message: 'Email username cannot start, end, or contain consecutive dots.' };
  }

  // Domain part (after @)
  if (!domainPart || !domainPart.includes('.')) {
    return { valid: false, message: 'Please enter a complete domain with an extension (e.g. .com, .edu, .org).' };
  }

  const domainLower = domainPart.toLowerCase();

  // Check blocked test/dummy/disposable domains
  if (BLOCKED_DOMAINS.has(domainLower)) {
    return {
      valid: false,
      message: `Test or dummy domain "@${domainLower}" is prohibited. Please enter an authentic email.`
    };
  }

  // Check domain structure
  const domainSegments = domainLower.split('.');
  if (domainSegments.some((seg) => !seg || seg.length === 0)) {
    return { valid: false, message: 'Domain extension format is invalid.' };
  }

  const tld = domainSegments[domainSegments.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { valid: false, message: 'Domain extension must have at least 2 letters (e.g., .com, .org, .in).' };
  }

  // Prohibit placeholder words anywhere in the domain name
  const disallowedNames = ['test', 'testing', 'fake', 'dummy', 'sample', 'temp', 'invalid'];
  if (domainSegments.some((seg) => disallowedNames.includes(seg))) {
    return {
      valid: false,
      message: `Test or dummy domain "@${domainLower}" is not allowed. Please enter an authentic email.`
    };
  }

  return { valid: true, message: 'Valid & authentic email format.' };
}

/**
 * Validates email format boolean check.
 */
export function isValidEmail(email) {
  return validateEmail(email).valid;
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

/**
 * Validates personal name or organization name:
 * - Must not be empty.
 * - Must not be numbers, digits, or numeric strings (e.g. 12345, 987654).
 * - For learners: Must contain only letters, spaces, hyphens, and apostrophes (e.g. "John Doe", "Dr. A. Sharma"). Numbers are strictly prohibited.
 * - For organizations: Must contain at least 3 letters and cannot be purely numeric.
 * - Rejects single-character repetitive gibberish (e.g. "aaaaa").
 * Returns { valid: boolean, message: string }
 */
export function validateName(name, accountType = 'learner') {
  const raw = (name || '').trim();
  if (!raw) {
    return {
      valid: false,
      message: accountType === 'organization' ? 'Please enter your organization name.' : 'Please enter your full name.'
    };
  }

  // Reject if purely numeric or mostly digits
  if (/^\d+$/.test(raw)) {
    return {
      valid: false,
      message: 'Name cannot be numbers or digits. Please enter a genuine name.'
    };
  }

  // Count letters
  const letterCount = (raw.match(/[a-zA-Z]/g) || []).length;

  if (accountType === 'organization') {
    if (letterCount < 3) {
      return {
        valid: false,
        message: 'Organization name must contain at least 3 letters.'
      };
    }
    if (!/^[a-zA-Z0-9\s&.,'()-]+$/.test(raw)) {
      return {
        valid: false,
        message: 'Organization name contains invalid special characters.'
      };
    }
  } else {
    // Individual Learner Name:
    // Numbers are strictly forbidden in personal names
    if (/\d/.test(raw)) {
      return {
        valid: false,
        message: 'Personal name cannot contain numbers. Please use letters only.'
      };
    }
    if (letterCount < 2) {
      return {
        valid: false,
        message: 'Name must contain at least 2 letters.'
      };
    }
    // Letters, spaces, hyphens, apostrophes, and periods (e.g. "John Doe", "Mary-Jane", "O'Connor", "A. P. J. Kalam")
    if (!/^[a-zA-Z\s.'-]+$/.test(raw)) {
      return {
        valid: false,
        message: 'Name can only contain alphabetic letters, spaces, hyphens, or periods.'
      };
    }
  }

  // Detect repetitive single character gibberish like "aaaaaa" or "zzzzz"
  if (/^(.)\1{4,}$/i.test(raw.replace(/\s+/g, ''))) {
    return {
      valid: false,
      message: 'Please enter a genuine, realistic name.'
    };
  }

  return { valid: true, message: 'Valid name.' };
}

/**
 * Validates name format boolean check.
 */
export function isValidName(name, accountType = 'learner') {
  return validateName(name, accountType).valid;
}
