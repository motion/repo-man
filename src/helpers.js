import FS from 'sb-fs'
import Path from 'path'

export async function ensureSetup() {
  await FS.mkdirp('~/.repoman')
}

export async function getScripts({ dir }) {
  const pkg = await FS.readFile(Path.join(dir, 'package.json'))

  if (!pkg) {
    throw new Error(`No package.json`)
  }

  const pkgScripts = JSON.parse(pkg).repoScripts

  if (!pkgScripts) {
    throw new Error(`No repoScripts key specified in package.json`)
  }

  return pkgScripts
}