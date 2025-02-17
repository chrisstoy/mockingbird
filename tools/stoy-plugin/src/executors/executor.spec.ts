import { ExecutorContext } from '@nx/devkit';

import { UpdateVersionExecutorSchema } from './schema';
import executor from './executor';

const options: UpdateVersionExecutorSchema = {
  versionFile: `${__dirname}/test-version.json`,
};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe('UpdateVersion Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
