export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }

  console.log(`INITIALIZING APP`);
  Object.keys(process.env).forEach((key) => {
    console.log(`${key}: ${process.env[key]}`);
  });
}
