// @flow
import Path from 'path'
import { ensureSetup, ensureScripts } from './helpers'
import type { Config } from './types'
import homeDir from 'os-homedir'

const CWD = process.cwd()

export default class RepoMan {
  config: Config

  constructor(config: Object = {}) {
    this.config = {
      repomanDir: config.repomanDir || Path.join(homeDir(), '.repoman'),
    }
    this.setup()
  }

  setup = async () => {
    await ensureSetup(this.config)
  }

  // setup repoman
  bootstrap = async (options, repos) => {
    const scripts = await ensureScripts(CWD, this.config)
    console.log('scripts', scripts)
  }

  // move a project from current location to root repoman folder and track it
  eject = (options, repos) => {
    console.log(options, repos)
  }

  // track a project in its current folder (for status, etc)
  track = (options, repos) => {
    console.log(options, repos)
  }

  // untrack any tracked project
  untrack = (options, repos) => {
    console.log = (options, repo =>s)
  }

  // get status of all projects or individual project
  status = (options, repos) => {
    console.log = (options, repo =>s)
  }

  // helper to `repoman exec -- npm run publish`
  publish = (options, repos) => {
    console.log(options, repos)
  }

  exec = (options, repos) => {
    console.log(options, repos)
  }
}