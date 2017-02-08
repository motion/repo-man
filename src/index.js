// @flow

import Path from 'path'
import FS from 'sb-fs'
import copy from 'sb-copy'

import Context from './context'
import Status from './commands/status'
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
    this.context = new Context(options)
  }
  getCommands(): Array<Command> {
    return this.context.getCommands()
  }
  async get(path: string): Promise<number> {
    // clones the repo into projects dir
    const parsed = Helpers.parseSourceURI(path)
    const projectsRoot = this.context.getProjectsRoot()
    const targetName = Helpers.getSuggestedDirectoryName(parsed.uri)
    const targetDirectory = Path.join(projectsRoot, targetName)

    await FS.mkdirp(projectsRoot)
    if (await FS.exists(targetDirectory)) {
      throw new Helpers.RepoManError(`Directory ${targetName} already exists in Project root`)
    }

    const params = ['clone', parsed.uri, targetDirectory]
    const logOutput = (givenChunk) => {
      const chunk = givenChunk.toString('utf8').trim()
      if (chunk.length) {
        this.context.log(chunk)
      }
    }
    const cloneExitCode = await this.context.spawn('git', params, { cwd: projectsRoot }, logOutput, logOutput)
    if (cloneExitCode !== 0) {
      return 1
    }
    if (parsed.tag) {
      const tagExitCode = await this.context.spawn('git', ['checkout', parsed.tag], { cwd: targetDirectory }, null, null)
      if (tagExitCode !== 0) {
        return 1
      }
    }
    this.context.log(`'${targetName}' successfully cloned`)
    return 0
  }
  async status() {
    const repos = [
      { name: 'gloss', version: '0.8.0', path: '/Users/nw/company/gloss' },
      { name: 'repoman', version: '1.0.0', path: '/Users/nw/projects/repoman' },
    ]
    await new Status(repos).print()
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
