#!/usr/bin/env node
// @flow

import command from 'sb-command'
import manifest from '../package.json'
import RepoMan from './'

require('process-bootstrap')('repoman')

function repoManify(callback) {
  return function() {
    RepoMan.get().then(callback).catch(function(error) {
      console.log('Error', error)
      process.exitCode = 1
    })
  }
}

command
  .version(manifest.version)
  .description('Manage your repos')
  // .command('publish [repos...]', 'Release new versions', RepoMan.release)
  // .command('status', 'Get status of repos', RepoMan.status)
  // .command('exec', 'Exec shell command in every repo', RepoMan.run)
  // .command('bootstrap', 'Bootstrap package', RepoMan.bootstrap)
  // .default(RepoMan.status)
  .command('get <remote_path>', 'Clone the given path into Projects root', repoManify(function(repoMan) {
    console.log('Yo! Get something')
  }))
  .default(function() {
    console.log('Welcome to RepoMan. Use --help to get list of available commands')
  })
  .parse(process.argv)
