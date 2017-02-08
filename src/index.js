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
  async get(path: string) {
    // clones the repo into projects dir
    const projectRoot = this.config.get('projectRoot')
    console.log(projectRoot, path)
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
}

module.exports = RepoMan
