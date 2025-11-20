#!/usr/bin/env node

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runUpdate } from './workflows/update';
import { runList } from './workflows/list';

interface UpdateArgs {
  workspace?: string;
  list?: boolean;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(
      '$0',
      'Run product research daily report updates',
      (yargs: Argv) => {
        return yargs
          .option('workspace', {
            type: 'string',
            description: 'Workspace directory for Claude Agent SDK',
          })
          .option('list', {
            type: 'boolean',
            description: 'List mode - only echo content without writing files',
            default: false,
          });
      },
      async (args: UpdateArgs) => {
        if (args.list) {
          await runList();
        } else {
          await runUpdate(args.workspace);
        }
      }
    )
    .help()
    .version('1.0.0')
    .parse();
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
