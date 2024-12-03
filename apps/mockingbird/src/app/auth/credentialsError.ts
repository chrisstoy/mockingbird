export class CredentialsError {
  message: string;
  type:
    | 'emailAndPasswordRequired'
    | 'userNotFound'
    | 'passwordNotFound'
    | 'invalidPassword'
    | 'invalidEmail'
    | 'errorComparingPasswords'
    | 'passwordExpired';

  constructor(type: CredentialsError['type'], message: string) {
    this.message = message;
    this.type = type;
  }
}
