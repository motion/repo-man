// @flow

import pad from 'pad/lib/colors'

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
