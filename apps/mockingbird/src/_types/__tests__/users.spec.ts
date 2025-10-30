import { ZodError } from 'zod';
import { UserIdSchema } from '../ids';
import { EmailAddressSchema } from '../users';

describe('UserIdSchema', () => {
  it('should parse a valid user id', () => {
    expect(UserIdSchema.parse('cm1750szo00001ocb5aog8ley')).toBe(
      'cm1750szo00001ocb5aog8ley'
    );
  });

  it('should report error for invalid user id', () => {
    expect(() => UserIdSchema.parse(24601)).toThrow(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          message: 'must be a string',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => UserIdSchema.parse({ id: 'test' })).toThrow(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'object',
          message: 'must be a string',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => UserIdSchema.parse(null)).toThrow(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'object',
          message: 'must be a string',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => UserIdSchema.parse(undefined)).toThrow(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          message: 'must be a string',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => UserIdSchema.parse('')).toThrow(
      new ZodError([
        {
          code: 'custom',
          message: 'invalid id',
          fatal: true,
          path: [],
        },
      ])
    );
  });
});

describe('EmailAddressSchema', () => {
  it('should parse a valid email address', () => {
    expect(EmailAddressSchema.parse('H0YfK@example.com')).toBe(
      'H0YfK@example.com'
    );
  });

  it('should report error for invalid email address', () => {
    expect(() => EmailAddressSchema.parse(null)).toThrow(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'object',
          message: 'must be a string',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => EmailAddressSchema.parse('')).toThrow(
      new ZodError([
        {
          code: 'custom',
          message: 'invalid email address',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => EmailAddressSchema.parse('bilbo')).toThrow(
      new ZodError([
        {
          code: 'custom',
          message: 'invalid email address',
          fatal: true,
          path: [],
        },
      ])
    );

    expect(() => EmailAddressSchema.parse('bilbo@baggend.')).toThrow(
      new ZodError([
        {
          code: 'custom',
          message: 'invalid email address',
          fatal: true,
          path: [],
        },
      ])
    );
  });
});
