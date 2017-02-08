// @flow

import Path from 'path'
import FS from 'sb-fs'
import copy from 'sb-copy'
import ConfigFile from 'sb-config-file'
import * as Helpers from './helpers'

const PRIVATE = {}

class RepoMan {
  state: ConfigFile;
  config: ConfigFile;
  stateDirectory: string;
  constructor(something: Object, stateDirectory: string) {
    if (something !== PRIVATE) {
      throw new Error('Invalid invocation of new RepoMan() use RepoMan.create() instead')
    }
    this.stateDirectory = stateDirectory
    this.state = new ConfigFile(Path.join(stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(stateDirectory, 'config.json'))
  }
  async initialize() {
    await FS.mkdirp(this.stateDirectory)
    await copy(Path.normalize(Path.join(__dirname, '..', 'template', 'root')), this.stateDirectory, {
      overwrite: false,
      failIfExists: false,
    })
  }
  async get() {
    // clones the repo into projects dir
  }
  static async get(stateDirectory: ?string = null): Promise<RepoMan> {
    const repoMan = new RepoMan(PRIVATE, Helpers.getStateDirectory(stateDirectory))
    await repoMan.initialize()
    return repoMan
  }
}

module.exports = RepoMan
