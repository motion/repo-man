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
    middle: '   ',
  },
  style: {
    'padding-left': 0,
    'padding-right': 0,
  },
}

type Column = string | [string, 'left' | 'center' | 'right']

export default class Table {
  constructor({ head: givenHead }: Array<Column>) {
    const head = givenHead.filter(i => i).map(Table.processEntry)
    // $FlowIgnore: Flow doesn't know that tty stdout can inherit readline columns
    const columns = process.stdout.columns
    const columnWidth = Math.min(30, Math.round(columns / head.length) * 0.9)

    this.table = new CLITable({ head, colWidths: new Array(head.length).fill(columnWidth) })
  }
  push(row: Array<any>) {
    return this.table.push(row.filter(i => i).map(Table.processEntry))
  }
  show() {
    return this.table.toString()
  }
  static processEntry(entry: Column): Object {
    return {
      content: Array.isArray(entry) ? entry[0] : entry,
      hAlign: Array.isArray(entry) ? entry[1] : 'left',
    }
  }
}
