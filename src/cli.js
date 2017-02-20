#!/usr/bin/env node
// @flow

import command from 'sb-command'
import manifest from '../package.json'
import RepoMan from './'
import { BUILTIN_COMMANDS } from './helpers'

require('process-bootstrap')('repoman')

// Local helper function
function handleError(error) {
  if (error && error.name === 'RepoManError') {
    console.log('Error:', error.message)
  } else {
    console.log('Error', error)
  }
  process.exit(1)
}
function isBuiltinCommand(entry: string) {
  return BUILTIN_COMMANDS.has(entry.split(' ')[0])
}

RepoMan.get().then(function(repoMan) {
  // Basic setup
  command
    .version(manifest.version)
    .description('Repository management tool')

  const commands = repoMan.getCommands()

  const registerCommand = (c) => {
    const prefix = !isBuiltinCommand(c.name) ? 'run.' : ''
    command.command(`${prefix}${c.name}`, c.description, (...params) => c.run(...params))
  }

  // First register builtin commands
  commands.filter(c => isBuiltinCommand(c.name)).forEach(registerCommand)

  // Then register non-builtin commands
  commands.filter(c => !isBuiltinCommand(c.name)).forEach(registerCommand)

  // Options for exec
  command.option('--scope <packages>', 'Comma separated list of packages to execute in')
  command.option('--ignore <packages>', 'Comma separated list of packages to ignore in')

  // Run it
  return command.process()
}).catch(handleError)
