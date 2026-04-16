import { ReactionType } from '@/_types';

export const REACTION_EMOJI: Record<ReactionType, string> = {
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  CHEER: '🎉',
  ANGER: '😠',
  LAUGH: '😂',
  HUGS: '🤗',
};

export const REACTION_LABEL: Record<ReactionType, string> = {
  THUMBS_UP: 'Like',
  THUMBS_DOWN: 'Dislike',
  CHEER: 'Cheer',
  ANGER: 'Angry',
  LAUGH: 'Haha',
  HUGS: 'Hugs',
};

export const ALL_REACTION_TYPES: ReactionType[] = [
  'THUMBS_UP',
  'THUMBS_DOWN',
  'CHEER',
  'ANGER',
  'LAUGH',
  'HUGS',
];
