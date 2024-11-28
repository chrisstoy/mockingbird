import { PromiseExecutor, readJsonFile, writeJsonFile } from '@nx/devkit';
import { UpdateVersionExecutorSchema } from './schema';

interface VersionSchema {
  version: string;
  buildDate: string;
}

const runExecutor: PromiseExecutor<UpdateVersionExecutorSchema> = async (
  options,
  context
) => {
  if (context.isVerbose) {
    console.log(`options = ${JSON.stringify(options, null, 2)}`);
    console.log(
      `context = ${JSON.stringify(
        {
          root: context.root,
          cwd: context.cwd,
        },
        null,
        2
      )}`
    );
  }

  const buildDate = new Date().toISOString();
  console.log(
    `Updating build date in file: ${options.versionFile} to ${buildDate}`
  );

  // read version file
  const originalData = readJsonFile<VersionSchema>(options.versionFile);

  // update Date
  const newData = {
    ...originalData,
    buildDate,
  };

  // write updated version file
  writeJsonFile(options.versionFile, newData);

  return {
    success: true,
  };
};

export default runExecutor;
