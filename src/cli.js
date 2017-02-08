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

RepoMan.get().then(function(repoMan) {
  // Basic setup
  command
    .version(manifest.version)
    .description('Repository management tool')

  const commands = repoMan.getCommands()
  const registerCommand = (c) => {
    command.command(c.name, c.description, c.callback)
  }

  // Plug the known builtin commands
  commands
    .filter(c => BUILTIN_COMMANDS.has(c.name))
    .forEach(registerCommand)

  // Plug the non-builtin commands
  commands
    .filter(c => !BUILTIN_COMMANDS.has(c.name))
    .forEach(registerCommand)

  // Default stuff
  command.default(function() { console.log('Welcome to RepoMan. Use --help to get list of available commands') })

  // Run it
  const processed = command.parse(process.argv, true)
  if (processed.errorMessage) {
    console.log('Error:', processed.errorMessage)
  }
  if (processed.errorMessage || processed.options.help) {
    command.showHelp('repoman')
    return null
  }
  return processed.callback(processed.options, ...processed.parameters)
}).catch(handleError)
