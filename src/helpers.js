// @flow

import Path from 'path'
import invariant from 'assert'
import expandTilde from 'expand-tilde'
import type { Options, ParsedRepo } from './types'

export const CONFIG_FILE_NAME = '.repoman.json'
export const CONFIG_DEFAULT_VALUE = {
  packages: ['./'],
  dependencies: [],
  configurations: [],
}

export class RepoManError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepoManError'
  }
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
  options.stateDirectory = expandTilde(options.stateDirectory)

  return options
}

const REGEX_URI_SCHEME = /^([0-9a-z-_\.]+)\/([0-9a-z-_\.]+)(#[a-f0-9]+)?(:[0-9a-z-_]+)?$/i
export function parseSourceURI(projectsRoot: string, given: string): ParsedRepo {
  if (!REGEX_URI_SCHEME.test(given)) {
    throw new RepoManError(`Invalid source provided '${given}', supported syntax is username/repository#tag`)
  }
  let tag = null
  let subpath = null
  const matched = REGEX_URI_SCHEME.exec(given)
  const org = matched[1]
  const name = matched[2]
  if (matched[3]) {
    // Remove the hash in front
    tag = matched[3].slice(1)
  }
  if (matched[4]) {
    // Remove : in front
    subpath = matched[4].slice(1)
  }
  return { org, tag, name, subpath, path: Path.join(projectsRoot, org, name) }
}
