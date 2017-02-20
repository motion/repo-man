// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import invariant from 'assert'

import Command from './command'
import Commands from './commands'
import * as Helpers from './helpers'
import type { Options } from './types'

const PRIVATE = {}

class RepoMan {
  options: Options;
  commands: Map<string, Command>;
  constructor(something: Object, options: Options) {
    if (something !== PRIVATE) {
      throw new Error('Invalid invocation of new RepoMan() use RepoMan.create() instead')
    }
    this.options = options
    this.commands = new Map()

    Commands.forEach((command) => { this.addCommand(command, options) })
  }
  getCommands(): Array<Command> {
    return Array.from(this.commands.values())
  }
  getCommand(name: string): ?Command {
    for (const [commandName, command] of this.commands) {
      if (commandName.split(' ')[0] === name) {
        return command
      }
    }
    return null
  }
  addCommand(Entry: Class<Command>, options: Options) {
    // initialize command class
    const command = new Entry(options, this)
    invariant(typeof command.name === 'string', 'name must be a string')
    invariant(typeof command.description === 'string', 'description must be a string')
    invariant(typeof command.run === 'function', 'run must be a function')
    this.removeCommand(command.name)
    this.commands.set(command.name, command)
  }
  removeCommand(name: string) {
    this.commands.delete(name)
  }
  // NOTE: All class methods should be ABOVE this method
  static async get(givenOptions: Object = {}): Promise<RepoMan> {
    const options = Helpers.fillConfig(givenOptions)
    await FS.mkdirp(options.stateDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'root')), options.stateDirectory, {
      overwrite: false,
      failIfExists: false,
    })

    const repoMan = new RepoMan(PRIVATE, options)
    const command = new Command(options, repoMan)
    await FS.mkdirp(command.getProjectsRoot())
    await FS.mkdirp(command.getConfigsRoot())
    return repoMan
  }
}

module.exports = RepoMan
