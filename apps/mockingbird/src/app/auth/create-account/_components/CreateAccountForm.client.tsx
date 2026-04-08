'use client';
import { fetchFromServer } from '@/_apiServices/fetchFromServer';
import { CreateUser, CreateUserSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { FormTextInput } from '@mockingbird/stoyponents';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { getTurnstileSiteKey } from './getTurnstileSiteKey';

export function CreateAccountForm() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>('');

  useEffect(() => {
    (async () => {
      const siteKey = await getTurnstileSiteKey();
      setTurnstileSiteKey(siteKey);
    })();
  }, []);

  const onSubmit: SubmitHandler<CreateUser> = async (data: CreateUser) => {
    const { name, email, password, confirmPassword: _confirmPassword } = data;

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const response = await fetchFromServer('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, turnstileToken }),
      });

      if (response.status !== 201) {
        const { message } = await response.json();
        setError(`${message}`);
        return;
      }

      await signIn('credentials', { email, password, callbackUrl: '/' });
    } catch (err) {
      setError(`${err}`);
      setIsProcessing(false);
      throw err;
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setError('');
  };

  const handleTurnstileError = () => {
    setError('CAPTCHA verification failed. Please refresh and try again.');
    setTurnstileToken('');
  };

  const handleTurnstileExpire = () => {
    setError('CAPTCHA expired. Please refresh and try again.');
    setTurnstileToken('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          Create Account
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Join the Mockingbird community
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        autoComplete="off"
      >
        <div className="flex flex-col gap-3">
          <FormTextInput
            {...register('name')}
            error={errors?.name}
            placeholder="Full name"
          />
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
          <FormTextInput
            {...register('confirmPassword')}
            error={errors?.confirmPassword}
            placeholder="Confirm password"
            type="password"
          />
        </div>

        {error && (
          <div role="alert" className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isProcessing ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="loading loading-spinner loading-sm text-primary" />
            <span className="text-sm text-base-content/60">
              Creating your account...
            </span>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!turnstileToken}
            className="btn btn-primary w-full"
          >
            Create Account
          </button>
        )}
      </form>

      {turnstileSiteKey && (
        <Turnstile
          className="w-full"
          options={{
            theme: 'light',
            size: 'flexible',
            responseField: false,
            appearance: 'always',
          }}
          siteKey={turnstileSiteKey}
          onError={handleTurnstileError}
          onExpire={handleTurnstileExpire}
          onSuccess={handleTurnstileVerify}
        />
      )}

      <p className="text-center text-sm text-base-content/60">
        Already have an account?{' '}
        <Link
          className="text-primary font-semibold hover:underline"
          href="/auth/signin"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
