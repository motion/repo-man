#!/usr/bin/env node
// @flow

import command from 'sb-command'
import manifest from '../package.json'
import RepoMan from './'

require('process-bootstrap')('repoman')

function repoManify(callback: Function) {
  return function(...params) {
    RepoMan.get().then(function(repoMan) {
      return callback(...[repoMan].concat(params))
    }).catch(function(error) {
      if (error && error.name === 'RepoManError') {
        console.log('Error:', error.message)
      } else {
        console.log('Error', error)
      }
      process.exitCode = 1
    })
  }
}

command
  .version(manifest.version)
  .description('Manage your repos')
  // .command('publish [repos...]', 'Release new versions', RepoMan.release)
  .command('status', 'Get status of repos', repoManify((repoMan, _, remotePath) => {
    repoMan.status()
  }))
  // .command('exec', 'Exec shell command in every repo', RepoMan.run)
  // .command('bootstrap', 'Bootstrap package', RepoMan.bootstrap)
  // .default(RepoMan.status)
  .command('get <remote_path>', 'Clone the given path into Projects root', repoManify(function(repoMan, _, remotePath) {
    return repoMan.get(remotePath)
  }))
  .default(function() {
    console.log('Welcome to RepoMan. Use --help to get list of available commands')
  })
  .parse(process.argv)
