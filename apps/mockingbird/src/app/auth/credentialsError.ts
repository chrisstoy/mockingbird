import { CredentialsSignin } from 'next-auth';

export class CredentialsError extends CredentialsSignin {
  constructor(
    public readonly errorType:
      | 'emailAndPasswordRequired'
      | 'userNotFound'
      | 'passwordNotFound'
      | 'invalidPassword'
      | 'invalidEmail'
      | 'errorComparingPasswords'
      | 'passwordExpired',
    message: string
  ) {
    super(message);
    this.code = errorType;
  }
}
