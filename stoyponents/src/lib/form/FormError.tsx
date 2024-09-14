import { FieldError } from 'react-hook-form';

interface Props {
  error?: FieldError;
}

export function FormError({ error }: Props) {
  return <>{error && <div className="text-error">{error.message}</div>}</>;
}
