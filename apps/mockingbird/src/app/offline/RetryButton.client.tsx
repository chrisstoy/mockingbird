'use client';

export function RetryButton() {
  return (
    <button
      className="btn btn-primary"
      onClick={() => window.location.reload()}
    >
      Try again
    </button>
  );
}
