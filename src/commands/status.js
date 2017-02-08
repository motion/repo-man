import Color from 'cli-color'
import Figures from 'figures'
import gitStatus from '../helpers/gitStatus'
import pkgInfo from 'package-info'
import promisify from 'sb-promisify'
import { rPad, lPad } from '../helpers'

const npmInfo = promisify(pkgInfo)
const NEWLINE = "\n"

export default class Status {
  constructor(repos) {
    this.repos = repos
  }

  async print() {
    const repoInfos = await Promise.all(this.repos.map(async repo => {
      const [git, npm] = await Promise.all([
        gitStatus({ cwd: repo.path }),
        npmInfo(repo.name),
      ])
      return {
        ...repo,
        git,
        npm,
      }
    }))

    const Symbols = {
      check: Color.green(Figures.tick),
      x: Color.red(Figures.cross),
      star: Color.yellow(Figures.star),
    }

    const repoLog = ({ name, path, version, git, npm }) => {
      const GIT_DIRTY_FLAG = git.clean ? Symbols.check : Symbols.x
      const GIT_NUM_FILES = git.files.length
      const LOCAL = git.local_branch
      const REMOTE = git.remote_branch
      const log = {
        gitstatus: `${GIT_DIRTY_FLAG} ${rPad(`${GIT_NUM_FILES}`, 3)}`,
        name: `${rPad(name, 10)}`,
        gitlocation: rPad(`${Color.yellow(LOCAL)}:${REMOTE}`, 30),
        location: `${lPad(path, 26)}`,
        npm: lPad(`${Color.yellow(version)} ${Figures.arrowRight} ${npm.version}`, 15),
      }

      return `${log.gitstatus} ${log.name} | ${log.npm} | ${log.location} | ${log.gitlocation}`
    }

    const header = [
      Color.bgYellow.white(' git '),
      Color.bgCyan.white('    name    '),
      Color.bgMagenta.white('    npm version    '),
      Color.bgBlue.white('            path            '),
      Color.bgGreen.white('             branch             '),
    ].join("")

    console.log(NEWLINE+header)
    console.log(repoInfos.map(repoLog).join(NEWLINE), NEWLINE)
  }
}
