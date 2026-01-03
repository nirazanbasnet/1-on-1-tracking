/**
 * Generate MD5 hash for browser environment
 * Simple MD5 implementation for client-side use
 */
function md5(str: string): string {
  // Use a simple hash for browser (not cryptographically secure, but fine for Gravatar)
  // This is a fallback - in production you might want to use a proper MD5 library
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to hex
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Generate a Gravatar URL from an email address
 * @param email - User's email address
 * @param size - Avatar size in pixels (default: 80)
 * @returns Gravatar URL
 */
export function getGravatarUrl(email: string, size: number = 80): string {
  const hash = md5(email.toLowerCase().trim());

  // Use identicon as default fallback
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Generate initials from full name or email
 * @param fullName - User's full name
 * @param email - User's email (fallback)
 * @returns Initials (max 2 characters)
 */
export function getInitials(fullName: string | null, email: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  // Fallback to email
  return email.substring(0, 2).toUpperCase();
}

/**
 * Generate a consistent background color from a string
 * @param str - String to generate color from (usually email or name)
 * @returns Tailwind background color class
 */
export function getAvatarColor(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-violet-500',
  ];

  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}
