// @flow

import Path from 'path'
import FS from 'sb-fs'
import copy from 'sb-copy'
import ConfigFile from 'sb-config-file'
import Prompt from './helpers/prompt'
import gitStatus from './helpers/gitStatus'
import Color from 'cli-color'
import Figures from 'figures'
import pad from 'pad/lib/colors'
import * as Helpers from './helpers'

const PRIVATE = {}

const rpad = (str, amt) => pad(`${str}`, amt, ' ', true)
const lpad = (str, amt) => pad(amt, `${str}`, ' ', true)

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
  async status() {
    const repos = [
      { name: 'gloss', path: '/Users/nw/company/gloss' },
      { name: 'repoman', path: '/Users/nw/projects/repoman' },
    ]

    const repoInfos = await Promise.all(repos.map(async repo => {
      const status = await gitStatus({ cwd: repo.path })
      return {
        ...repo,
        status,
      }
    }))

    const Symbols = {
      check: Color.green(Figures.tick),
      x: Color.red(Figures.cross),
      star: Color.yellow(Figures.star),
    }

    const repoLog = ({ status, name }) => {
      const GIT_DIRTY_FLAG = status.clean ? Symbols.check : Symbols.x
      const GIT_NUM_FILES = status.files.length
      const LOCAL = status.local_branch
      const REMOTE = status.remote_branch
      const log = {
        gitstatus: `${GIT_DIRTY_FLAG} ${rpad(GIT_NUM_FILES, 3)}`,
        name: `${rpad(name, 10)}`,
        gitlocation: `${Color.yellow(lpad(LOCAL, 10))} : ${rpad(REMOTE, 10)}`,
      }      
      return `${log.gitstatus} ${log.name} | ${log.gitlocation}`
    }

    console.log(repoInfos.map(repoLog).join("\n"))
  }
}

module.exports = RepoMan
