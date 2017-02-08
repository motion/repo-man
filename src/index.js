// @flow

import Path from 'path'
import FS from 'sb-fs'
import copy from 'sb-copy'

import Context from './context'
import Status from './commands/status'
import * as Helpers from './helpers'

const PRIVATE = {}

class RepoMan {
  context: Context;
  stateDirectory: string;
  constructor(something: Object, stateDirectory: string) {
    if (something !== PRIVATE) {
      throw new Error('Invalid invocation of new RepoMan() use RepoMan.create() instead')
    }
    this.context = new Context(stateDirectory)
    this.stateDirectory = stateDirectory
  }
  async get(path: string): Promise<number> {
    // clones the repo into projects dir
    const parsed = Helpers.parseSourceURI(path)
    const projectsRoot = this.context.getProjectsRoot()
    const projectsRootPath = Helpers.processPath(projectsRoot)
    const targetName = Helpers.getSuggestedDirectoryName(parsed.uri)
    const targetDirectory = Path.join(projectsRootPath, targetName)

    await FS.mkdirp(projectsRootPath)
    if (await FS.exists(targetDirectory)) {
      throw new Helpers.RepoManError(`Directory ${targetName} already exists in Project root`)
    }

    const params = ['clone', parsed.uri, targetDirectory]
    const logOutput = (givenChunk) => {
      const chunk = givenChunk.toString('utf8').trim().replace(/\n/g, ' ')
      if (chunk.length) {
        this.context.log(chunk)
      }
    }
    const cloneExitCode = await this.context.spawn('git', params, { cwd: projectsRootPath }, logOutput, logOutput)
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
  static async get(givenStateDirectory: ?string = null): Promise<RepoMan> {
    const stateDirectory = Helpers.getStateDirectory(givenStateDirectory)
    await FS.mkdirp(stateDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'root')), stateDirectory, {
      overwrite: false,
      failIfExists: false,
    })

    return new RepoMan(PRIVATE, stateDirectory)
  }
  async status() {
    const repos = [
      { name: 'gloss', version: '0.8.0', path: '/Users/nw/company/gloss' },
      { name: 'repoman', version: '1.0.0', path: '/Users/nw/projects/repoman' },
    ]
    await new Status(repos).print()
  }
}

module.exports = RepoMan
