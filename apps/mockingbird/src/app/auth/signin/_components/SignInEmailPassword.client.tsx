'use client';
import { PasswordSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextInput } from '@mockingbird/stoyponents';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const LoginEmailPasswordSchema = z.object({
  email: z.string().email(),
  password: PasswordSchema,
});

type LoginEmailPassword = z.infer<typeof LoginEmailPasswordSchema>;

interface Props {
  onSignIn: (email: string, password: string) => void;
}

export function SignInEmailPassword({ onSignIn }: Props) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginEmailPassword>({
    resolver: zodResolver(LoginEmailPasswordSchema),
  });

  async function handleSignIn({ email, password }: LoginEmailPassword) {
    onSignIn(email, password);
  }

  return (
    <form
      onSubmit={handleSubmit(handleSignIn)}
      className="flex flex-col gap-4"
      autoComplete="off"
    >
      <div className="flex flex-col gap-3">
        <FormTextInput
          {...register('email')}
          error={errors?.email}
          placeholder="Email address"
        />
        <FormTextInput
          {...register('password')}
          error={errors?.password}
          placeholder="Password"
          type="password"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Sign In
      </button>
    </form>
  );
}
