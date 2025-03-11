'use client';
import { fetchFromServer } from '@/_apiServices/fetchFromServer';
import { CreateUser, CreateUserSchema } from '@/_types/createUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextInput } from '@mockingbird/stoyponents';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';

const createNewAccountHandler = (
  setError: Dispatch<SetStateAction<string | null>>,
  setIsProcessing: Dispatch<SetStateAction<boolean>>
) =>
  async function createNewAccount({
    name,
    email,
    password,
    confirmPassword,
  }: CreateUser) {
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
        callbackUrl: '/',
      });
    } catch (error) {
      console.error(error);
      setError(`${error}`);
      setIsProcessing(false);
      throw error;
    }
  };

export function CreateAccountForm() {
  const form = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = form;

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <form
      onSubmit={handleSubmit(
        createNewAccountHandler(setError, setIsProcessing)
      )}
      className="flex flex-col text-center"
      autoComplete="off"
    >
      <h1 className="font-bold mb-2 text-lg">Join the Mockingbird Community</h1>
      <div className="card-actions flex flex-col text-start">
        <FormTextInput
          {...register('name')}
          error={errors?.name}
          placeholder="Nickname/Handle"
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
            <button type="submit" className="btn btn-primary w-full">
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
  );
}
