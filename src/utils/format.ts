/**
 * Utility functions for currency formatting in Philippine Peso (₱)
 * and e-wallet validation (GCash and Maya).
 */

export const formatPeso = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Validates Philippine mobile number for GCash / Maya
 * Accepts: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX or 639XXXXXXXXX
 */
export const validatePHMobileNumber = (phone: string): { isValid: boolean; message?: string } => {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  if (!cleaned) {
    return { isValid: false, message: 'Mobile number is required.' };
  }

  // Check if starts with 09 and is 11 digits
  if (/^09\d{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  // Check if starts with 639 and is 12 digits
  if (/^639\d{9}$/.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: 'Must be a valid 11-digit PH mobile number starting with 09 (e.g., 09171234567).'
  };
};

/**
 * Validates GCash or Maya Reference Number / Transaction ID
 * Must be 8 to 16 characters/digits (e.g. 10293847561)
 */
export const validateEWalletRefNumber = (ref: string): { isValid: boolean; message?: string } => {
  const cleaned = ref.trim().replace(/\s+/g, '');

  if (!cleaned) {
    return { isValid: false, message: 'Payment Reference Number is required for GCash/Maya.' };
  }

  if (cleaned.length < 8) {
    return { isValid: false, message: 'Reference number is too short (minimum 8 digits/chars, e.g. 10293847561).' };
  }

  if (cleaned.length > 20) {
    return { isValid: false, message: 'Reference number is too long (maximum 20 digits/chars).' };
  }

  if (!/^[a-zA-Z0-9\-\_]+$/.test(cleaned)) {
    return { isValid: false, message: 'Reference number must contain only letters and numbers.' };
  }

  return { isValid: true };
};
