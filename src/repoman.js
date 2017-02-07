import { ensureSetup, getScripts } from './helpers'

const CWD = process.cwd()

export default class RepoMan {
  constructor() {
  }

  init(options, repos) {
    console.log(options, repos)
  }

  async bootstrap(options, repos) {
    await ensureSetup()
    const scripts = await getScripts({ dir: CWD })
    console.log('scripts', scripts)
  }

  add(options, repos) {
    console.log(options, repos)
  }

  remove(options, repos) {
    console.log(options, repos)
  }

  status(options, repos) {
    console.log(options, repos)
  }

  publish(options, repos) {
    console.log(options, repos)
  }

  exec(options, repos) {
    console.log(options, repos)
  }
}