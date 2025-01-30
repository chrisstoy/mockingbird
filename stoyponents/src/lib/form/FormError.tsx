import { FieldError } from 'react-hook-form';

interface Props {
  error?: FieldError;
}

export function FormError({ error }: Props) {
  if (!error) return null;

  return <div className="text-error">{error.message}</div>;
}
