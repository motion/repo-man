// @flow

import FS from 'sb-fs'
import Path from 'path'
import * as Helpers from './helpers'
import { RepoManError } from '../../helpers'

export const name = 'get <remote_path>'
export const description = 'Clone the given path into projects root'
export async function callback(_: Object, path: string) {
  // clones the repo into projects dir
  const parsed = Helpers.parseSourceURI(path)
  const projectsRoot = this.getProjectsRoot()
  const targetName = Helpers.getSuggestedDirectoryName(parsed.uri)
  const targetDirectory = Path.join(projectsRoot, targetName)

  await FS.mkdirp(projectsRoot)
  if (await FS.exists(targetDirectory)) {
    throw new RepoManError(`Directory ${targetName} already exists in Project root`)
  }

  const params = ['clone', parsed.uri, targetDirectory]
  const logOutput = (givenChunk) => {
    const chunk = givenChunk.toString('utf8').trim()
    if (chunk.length) {
      this.log(chunk)
    }
  }
  const cloneExitCode = await this.spawn('git', params, { cwd: projectsRoot }, logOutput, logOutput)
  if (cloneExitCode !== 0) {
    process.exitCode = 1
    return
  }
  if (parsed.tag) {
    const tagExitCode = await this.spawn('git', ['checkout', parsed.tag], { cwd: targetDirectory }, null, null)
    if (tagExitCode !== 0) {
      process.exitCode = 1
      return
    }
  }
  this.log(`Successfully downloaded '${targetName}'`)
}
