import { z } from 'zod';
import { PasswordSchema } from './password';

export const CreateUserDataSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is too short')
    .max(100, { message: 'Name is too long' }),
  email: z.string().email(),
  password: PasswordSchema,
  turnstileToken: z.string().optional(),
});
export type CreateUserData = z.infer<typeof CreateUserDataSchema>;

export const CreateUserSchema = CreateUserDataSchema.extend({
  confirmPassword: PasswordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'], // path of error
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
