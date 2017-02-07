#!/usr/bin/env node
// @flow

import Path from 'path'
import command from 'sb-command'

require('process-bootstrap')('repoman')

command
  .version('0.0.1')
  .description('Manage your repos')
  .command('init', 'Sets up your root ~/.repoman config file', RepoMan.init)
  .command('track [repos...]', 'Add repo to repoman', RepoMan.track)
  .command('untrack [repos...]', 'Remove repo from repoman', RepoMan.untrack)
  .command('publish [repos...]', 'Release new versions', RepoMan.release)
  .command('status', 'Get status of repos', RepoMan.status)
  .command('exec', 'Exec shell command in every repo', RepoMan.run)
  .command('bootstrap', 'Bootstrap package', RepoMan.bootstrap)
  .default(RepoMan.status)
  .parse(process.argv)
