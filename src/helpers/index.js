// @flow

import pad from 'pad/lib/colors'
import invariant from 'assert'
import expandTilde from 'expand-tilde'

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

  return processPath(stateDirectory)
}

const COLOR = /\x1B\[(?:[0-9]{1,2}(?:;[0-9]{1,2})?)?[m|K]/g
const colorLen = (text: string) => {
  return text.replace(COLOR, '').length
}

const ellipse = (str: string, amt: number, cutLeft = false) => {
  if (colorLen(str) > amt + 1) {
    if (cutLeft) {
      return str.slice(0, amt - 3) + '...'
    }
    return '...' + str.slice(-(amt + 3))
  }
  return str
}

export const rPad = (str: string, amt: number = 1000, cutoff: boolean = true) =>
  pad(`${cutoff ? ellipse(str, amt) : str}`, amt, ' ', true)

export const lPad = (str: string, amt: number = 1000, cutoff: boolean = true) =>
  pad(amt, `${cutoff ? ellipse(str, amt, true) : str}`, ' ', true)
