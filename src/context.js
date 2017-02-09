import invariant from 'assert'
import type { CommandClass, Options } from './types'

export default class Context {
  commands: Array<CommandClass>;

  constructor() {
    this.commands = []
  }

  getCommands(): Array<CommandClass> {
    return this.commands
  }
  addCommand(Command: Class<CommandClass>, options: Options) {
    // initialize command class
    const command = new Command()

    command.initialize(options)
    command.run = command.run.bind(command)

    invariant(typeof command.name === 'string', 'name must be a string')
    invariant(typeof command.description === 'string', 'description must be a string')
    invariant(typeof command.run === 'function', 'run must be a function')
    this.removeCommand(command.name)
    this.commands.push(command)
  }
  removeCommand(name: string, run: ?Function = null) {
    let i = this.commands.length
    while (i--) {
      const entry = this.commands[i]
      if (entry.name === name && (!run || entry.run === run)) {
        this.commands.splice(i, 1)
      }
    }
  }
}
