// @flow

import Path from 'path'
import FS from 'sb-fs'
import copy from 'sb-copy'

import Context from './context'
import Commands from './commands'
import * as Helpers from './helpers'
import type { Options, Command } from './types'

const PRIVATE = {}

class RepoMan {
  options: Options;
  context: Context;
  constructor(something: Object, options: Options) {
    if (something !== PRIVATE) {
      throw new Error('Invalid invocation of new RepoMan() use RepoMan.create() instead')
    }
    this.options = options
    this.context = new Context()
    this.context.addCommand(Commands.Get, options)
    this.context.addCommand(Commands.Status, options)
    this.context.addCommand(Commands.Install, options)
    this.context.addCommand(Commands.Eject, options)
  }
  getCommands(): Array<Command> {
    return this.context.getCommands()
  }
  // NOTE: All commands or class methods should be ABOVE this method
  static async get(givenOptions: Object = {}): Promise<RepoMan> {
    const options = Helpers.fillConfig(givenOptions)
    await FS.mkdirp(options.stateDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'root')), options.stateDirectory, {
      overwrite: false,
      failIfExists: false,
    })

    return new RepoMan(PRIVATE, options)
  }
}

module.exports = RepoMan
