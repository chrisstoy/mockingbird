'use client';

import { forwardRef } from 'react';
import { FieldError } from 'react-hook-form';
import { FormError } from './FormError';

interface Props {
  label?: string;
  error?: FieldError | undefined;
  [key: string]: unknown;
}

export const FormTextInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...rest }: Props, ref) => {
    return (
      <div className="form-control w-full">
        {label && (
          <label className="label">
            <span className="label-text">{label}</span>
          </label>
        )}
        <input
          ref={ref}
          className={`input input-bordered w-full ${className}`}
          {...rest}
        />
        <FormError error={error} />
      </div>
    );
  }
);
