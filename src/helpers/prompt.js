import inquirer from 'inquirer'
import { LineBuffer, Line } from 'clui'
import clc from 'cli-color'

export default class Prompt {
  static list(options) {
    return inquirer.list({
      ...options,
      type: 'list',
      name: options.name || Math.random(),
    })
  }
  
  static checkbox(options) {
    return inquirer.prompt({
      ...options,
      type: 'checkbox',
      name: options.name || Math.random(),
    })
  }

  static table({ columns } = {}, rows) {
    const buffer = new LineBuffer({
      x: 0,
      y: 0,
      width: 'console',
      height: 'console',
    })

    const w = buffer.width()
    const h = buffer.height()
    const colWidth = Math.round(w / columns)

    rows.forEach(row => {
      const line = new Line(buffer)

      row.forEach(col => {
        const [name, color] = Array.isArray(col) ?
          [col[0], clc[col[1]]] :
          [col, clc.white]

        line.column(name, colWidth, [color])
      })

      line.fill().store()
    })

    // print
    buffer.output()
  }
}