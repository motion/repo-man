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
  }

  init = (options, repos) => {
    console.log(options, repos)
  }

  bootstrap = async (options, repos) => {
    await ensureSetup()
    const scripts = await ensureScripts(CWD, this.config)
    console.log('scripts', scripts)
  }

  add = (options, repos) => {
    console.log(options, repos)
  }

  remove = (options, repos) => {
    console.log = (options, repo =>s)
  }

  status = (options, repos) => {
    console.log = (options, repo =>s)
  }

  publish = (options, repos) => {
    console.log(options, repos)
  }

  exec = (options, repos) => {
    console.log(options, repos)
  }
}