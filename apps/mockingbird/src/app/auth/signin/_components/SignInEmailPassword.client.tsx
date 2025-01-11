'use client';
import { PasswordSchema } from '@/_types/password';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextInput } from '@mockingbird/stoyponents';
import { Dispatch, SetStateAction, useState } from 'react';
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
  const form = useForm<LoginEmailPassword>({
    resolver: zodResolver(LoginEmailPasswordSchema),
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = form;

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createLoginHandler = (
    setError: Dispatch<SetStateAction<string | null>>,
    setIsProcessing: Dispatch<SetStateAction<boolean>>
  ) =>
    async function handleSignInWithEmailAndPassword({
      email,
      password,
    }: LoginEmailPassword) {
      setError(``);
      setIsProcessing(true);

      try {
        console.log(
          `Logging in with User: ${JSON.stringify({
            email,
            password,
          })}`
        );

        onSignIn(email, password);
      } catch (error) {
        console.error(error);
        setError(`${error}`);
        setIsProcessing(false);
        throw error;
      }
    };

  return (
    <form
      onSubmit={handleSubmit(createLoginHandler(setError, setIsProcessing))}
      className="flex flex-col"
      autoComplete="off"
    >
      <div className="card-actions flex flex-col">
        <FormTextInput
          {...register('email')}
          error={errors?.email}
          placeholder="user@example.com"
        />

        <FormTextInput
          {...register('password')}
          error={errors?.password}
          placeholder="Password"
          type="password"
        />

        <button type="submit" className="btn btn-primary w-full">
          Sign In
        </button>
      </div>
      {error && <div className="text-error p-1">{error}</div>}
    </form>
  );
}
