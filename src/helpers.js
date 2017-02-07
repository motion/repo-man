// @flow
import FS from 'sb-fs'
import Path from 'path'
import gitClone from 'gitclone'
import gitParse from 'parse-github-short-url'
import type { Config } from './types'

export async function ensureSetup() {
  await FS.mkdirp('~/.repoman')
}

function cloneScripts(repo: string, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Cloning ${repo} into ${dest}...`)
    gitClone(repo, { dest, ssh: true }, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function ensureScripts(dir: string, config: Config) {
  const pkg = await FS.readFile(Path.join(dir, 'package.json'))

  if (!pkg) {
    throw new Error(`No package.json`)
  }

  const pkgScripts = JSON.parse(pkg).repoScripts

  if (!pkgScripts) {
    throw new Error(`No repoScripts key specified in package.json`)
  }

  const { repo } = gitParse(pkgScripts)

  if (!repo) {
    throw new Error(`Could not parse repo from: ${repo.toString()}`)
  }

  const dest = Path.join(config.repomanDir, repo.split('/').join('-'))

  await cloneScripts(pkgScripts, dest)

  return pkgScripts
}