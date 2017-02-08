// @flow

import invariant from 'assert'
import expandTilde from 'expand-tilde'

import type { Options } from '../types'

export const BUILTIN_COMMANDS = new Set(['get', 'status', 'exec', 'bootstrap', 'publish'])
export class RepoManError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepoManError'
  }
}

export function processPath(path: string): string {
  return expandTilde(path)
}
// Spec:
// If one is given, validate it to be a valid string
// Return the expanded tilde
// Priority:
// - Given
// - Environment Variable
// - Default
export function fillConfig(given: Object): Options {
  const options = {}

  if (given.stateDirectory) {
    invariant(typeof given.stateDirectory === 'string', 'options.stateDirectory must be a string')
    options.stateDirectory = given.stateDirectory
  } else if (process.env.REPOMAN_STATE_DIRECTORY) {
    options.stateDirectory = process.env.REPOMAN_STATE_DIRECTORY
  } else {
    options.stateDirectory = '~/.repoman'
  }
  options.stateDirectory = processPath(options.stateDirectory)

  return options
}
