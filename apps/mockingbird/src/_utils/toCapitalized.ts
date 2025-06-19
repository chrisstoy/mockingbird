/**
 * Given a string, returns a version of that string where the first
 * letter is capitalized and the rest of the letters are lowercased.
 * @param str The string to modify.
 * @returns The modified string.
 */
export function toCapitalized(str: string): string {
  if (!str) return str;
  const strCopy = str.toLowerCase();
  return strCopy.charAt(0).toUpperCase() + strCopy.slice(1);
}
