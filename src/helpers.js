// @flow

import invariant from 'assert'
import expandTilde from 'expand-tilde'

// Spec:
// If one is given, validate it to be a valid string
// Return the expanded tilde
// Priority:
// - Given
// - Environment Variable
// - Default
export function getStateDirectory(given: ?string): string {
  let stateDirectory

  if (given) {
    invariant(typeof given === 'string', 'stateDirectory must be a string')
    stateDirectory = given
  } else if (process.env.REPOMAN_STATE_DIRECTORY) {
    stateDirectory = process.env.REPOMAN_STATE_DIRECTORY
  } else {
    stateDirectory = '~/.repoman'
  }

  return expandTilde(stateDirectory)
}
