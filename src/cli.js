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

  function registerCommand(entry) {
    const prefix = isBuiltinCommand(entry.name) ? '' : 'run.'
    command.command(`${prefix}${entry.name}`, entry.description, (...params) => entry.run(...params))
    entry.options.forEach((option) => {
      // $FlowIgnore: Flow doens't like that I'm merging tuples, but I know what I'm doing
      command.option(option[0], option[1], option[2])
    })
  }


  // Global options
  command.option('--debug', 'Enable debugging', false)
  // First register builtin commands
  commands.filter(c => isBuiltinCommand(c.name)).forEach(registerCommand)
  // Then register non-builtin commands
  commands.filter(c => !isBuiltinCommand(c.name)).forEach(registerCommand)

  // Run it
  return command.process()
}).catch(handleError)
