import CLITable from 'cli-table2'

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
    middle: ' ',
  },
  style: {
    'padding-left': 0,
    'padding-right': 0,
  },
}

export default class Table {
  constructor(style = DEFAULT_STYLE) {
    this.table = new CLITable(style)
  }

  push(...args) {
    return this.table.push(...args)
  }

  print() {
    return this.table.toString()
  }
}
