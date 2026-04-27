import {
  GroupIdSchema,
  CreateGroupSchema,
  GroupVisibilitySchema,
} from '../groups';

describe('GroupIdSchema', () => {
  it('accepts valid cuid', () => {
    expect(() => GroupIdSchema.parse('cm1750szo00001ocb5aog8ley')).not.toThrow();
  });
  it('rejects empty string', () => {
    expect(() => GroupIdSchema.parse('')).toThrow();
  });
});

describe('CreateGroupSchema', () => {
  it('accepts valid create payload', () => {
    expect(() =>
      CreateGroupSchema.parse({
        name: 'Test Flock',
        visibility: 'PUBLIC',
      })
    ).not.toThrow();
  });

  it('rejects missing name', () => {
    expect(() =>
      CreateGroupSchema.parse({ visibility: 'PUBLIC' })
    ).toThrow();
  });
});

describe('GroupVisibilitySchema', () => {
  it('accepts PUBLIC and PRIVATE', () => {
    expect(GroupVisibilitySchema.parse('PUBLIC')).toBe('PUBLIC');
    expect(GroupVisibilitySchema.parse('PRIVATE')).toBe('PRIVATE');
  });
});
