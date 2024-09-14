import { z } from 'zod';

const createUserDataShape = {
  name: z
    .string()
    .min(2, 'Name is too short')
    .max(100, { message: 'Name is too long' }),
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: 'Password is too short' })
    .max(20, { message: 'Password is too long' }),
};

export const CreateUserDataSchema = z.object(createUserDataShape);
export type CreateUserData = z.infer<typeof CreateUserDataSchema>;

export const CreateUserSchema = CreateUserDataSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'], // path of error
});
export type CreateUser = z.infer<typeof CreateUserSchema>;
