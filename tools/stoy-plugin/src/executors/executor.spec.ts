import { ExecutorContext } from '@nx/devkit';

import executor from './executor';
import { UpdateVersionExecutorSchema } from './schema';

const options: UpdateVersionExecutorSchema = {
  versionFile: `${__dirname}/test-version.json`,
};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
  projectsConfigurations: undefined,
  nxJsonConfiguration: undefined,
  projectGraph: undefined,
};

describe('UpdateVersion Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
