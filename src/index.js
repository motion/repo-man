#!/usr/bin/env node

import command from 'sb-command'
import Path from 'path'
import RepoMan from './repoman'

const RepoManager = new RepoMan()

command
  .version('0.0.1')
  .description('Manage your repos')
  .command('init', 'Sets up your root ~/.repoman config file', RepoManager.init)
  .command('add [repos...]', 'Add repo to repoman', RepoManager.track)
  .command('remove [repos...]', 'Remove repo from repoman', RepoManager.untrack)
  .command('publish [repos...]', 'Release new versions', RepoManager.release)
  .command('status', 'Get status of repos', RepoManager.status)
  .command('exec', 'Exec shell command in every repo', RepoManager.run)
  .default(RepoManager.status)
  .parse(process.argv)
