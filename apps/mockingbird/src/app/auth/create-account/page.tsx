'use client';
import { CreateUser, CreateUserSchema } from '@/_types/schemas';
import { FormTextInput } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { redirect } from 'next/navigation';

export default function CreateAccountPage() {
  const form = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = form;

  const [error, setError] = useState<string | null>(null);

  async function createNewAccount({
    name,
    email,
    password,
    confirmPassword,
  }: CreateUser) {
    console.log(
      `Creating new User: ${JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
      })}`
    );

    // ensure user with this email address does not already exist

    // create user
    try {
      const response = await fetch('/api/users', {
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
      console.log(`Create User Response: ${JSON.stringify(response.ok)}`);
      redirect('/');
    } catch (error) {
      console.error(error);
      setError(`${error}`);
      throw error;
    }
  }

  return (
    <form
      onSubmit={handleSubmit(createNewAccount)}
      className="flex flex-col text-center"
      autoComplete="off"
    >
      <h1 className="font-bold mb-2 text-lg">Join the Mockingbird Community</h1>
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

        <button type="submit" className="btn btn-primary w-full">
          Create Account
        </button>
        <Link className="link link-hover self-center" href="/auth/signin">
          Cancel
        </Link>
      </div>
      {error && <div className="text-error p-1">{error}</div>}
    </form>
  );
}
