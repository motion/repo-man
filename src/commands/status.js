import Color from 'cli-color'
import Figures from 'figures'
import gitStatus from '../helpers/gitStatus'
import { rPad, lPad } from '../helpers'

export default class Status {
  constructor(repos) {
    this.repos = repos
  }

  async print() {
    const repoInfos = await Promise.all(this.repos.map(async repo => {
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
        gitstatus: `${GIT_DIRTY_FLAG} ${rPad(GIT_NUM_FILES, 3)}`,
        name: `${rPad(name, 10)}`,
        gitlocation: `${Color.yellow(lPad(LOCAL, 10))} : ${rPad(REMOTE, 10)}`,
      }      
      return `${log.gitstatus} ${log.name} | ${log.gitlocation}`
    }

    console.log(repoInfos.map(repoLog).join("\n")) 
  }
}
