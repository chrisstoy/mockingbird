import { toCapitalized } from '../toCapitalized'; // assuming the function is in the same file

describe('toCapitalized function', () => {
  it('should return an empty string when given an empty string', () => {
    expect(toCapitalized('')).toBe('');
  });

  it('should capitalize the first letter and lowercase the rest', () => {
    expect(toCapitalized('HELLO')).toBe('Hello');
  });

  it('should keep the first letter capitalized and lowercase the rest', () => {
    expect(toCapitalized('HeLlO')).toBe('Hello');
  });

  it('should handle strings with numbers and special characters', () => {
    expect(toCapitalized('hElLo123!@#')).toBe('Hello123!@#');
  });

  it('should handle strings with non-ASCII characters', () => {
    expect(toCapitalized('héllo')).toBe('Héllo');
  });

  it('should return copy of original string', () => {
    const originalString = 'HELLO';
    expect(toCapitalized(originalString)).toBe('Hello');
    expect(originalString).toBe('HELLO');
  });
});
