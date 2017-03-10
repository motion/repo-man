/* @flow */

const CLITable = require('cli-table')

const DEFAULT_STYLE = {
  chars: {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: '',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: '   ',
  },
  style: {
    'padding-left': 2,
    'padding-right': 0,
  },
}


export default class Table {
  head: Array<string>;
  rows: Array<Array<string>>;
  constructor({ head }: { head: Array<string> }) {
    this.rows = []
    this.head = head.filter(i => i)
  }
  push(row: Array<string>) {
    this.rows.push(row.filter(i => i))
  }
  show() {
    const table = new CLITable({
      ...DEFAULT_STYLE,
      head: this.head,
    })
    table.push(...this.rows)
    return table.toString()
  }
}
