import { AudienceSchema, audienceValues } from '../audience';

describe('AudienceSchema', () => {
  it('should validate valid audience values', () => {
    audienceValues.forEach((value) => {
      const result = AudienceSchema.safeParse(value);
      expect(result.success).toBe(true);
    });
  });

  it('should invalidate invalid audience values', () => {
    const invalidValues = ['invalid', 'unknown', ''];
    invalidValues.forEach((value) => {
      const result = AudienceSchema.safeParse(value);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('invalid audience');
    });
  });

  it('should invalidate non-string values', () => {
    const invalidValues = [123, true, null, undefined];
    invalidValues.forEach((value) => {
      const result = AudienceSchema.safeParse(value);
      expect(result.success).toBe(false);
    });
  });
});
