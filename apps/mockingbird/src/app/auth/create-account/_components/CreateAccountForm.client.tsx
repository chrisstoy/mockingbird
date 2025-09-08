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
    const { name, email, password, confirmPassword } = data;

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    setError(``);
    setIsProcessing(true);

    console.log(
      `Creating new User: ${JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
      })}`
    );

    // create user
    try {
      const response = await fetchFromServer('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          turnstileToken,
        }),
      });

      if (response.status !== 201) {
        // something went wrong
        const { message } = await response.json();
        console.error(message);
        setError(`${message}`);
        return;
      }

      console.log(`Created User: ${JSON.stringify(response)}`);
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/auth/tos',
      });
    } catch (error) {
      console.error(error);
      setError(`${error}`);
      setIsProcessing(false);
      throw error;
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setError('');
  };

  const handleTurnstileError = () => {
    setError('CAPTCHA verification failed. Please refresh page and again.');
    setTurnstileToken('');
  };

  const handleTurnstileExpire = () => {
    setError('CAPTCHA expired. Please refresh page and try again.');
    setTurnstileToken('');
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col text-center"
        autoComplete="off"
      >
        <h1 className="font-bold mb-2 text-lg">
          Join the Mockingbird Community
        </h1>
        <div className="card-actions flex flex-col text-start">
          <FormTextInput
            {...register('name')}
            error={errors?.name}
            placeholder="Full Name"
          ></FormTextInput>
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
          <FormTextInput
            {...register('confirmPassword')}
            error={errors?.confirmPassword}
            placeholder="Confirm Password"
            type="password"
          />

          {isProcessing ? (
            <div className="justify-center w-full flex m-8">
              <div className="loading loading-spinner mr-4"></div>
              Creating account...
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={!turnstileToken}
                className="btn btn-primary w-full"
              >
                Create Account
              </button>
              <Link className="link link-hover self-center" href="/auth/signin">
                Cancel
              </Link>
            </>
          )}
        </div>
        {error && <div className="text-error p-1">{error}</div>}
      </form>
      {turnstileSiteKey && (
        <div id="test" className="w-full">
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
        </div>
      )}
    </>
  );
}
