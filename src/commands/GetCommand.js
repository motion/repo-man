// @flow

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class GetCommand extends Command {
  name = 'get <remote_path>'
  description = 'Clone the given path into projects root'

  async run(_: Object, path: string) {
    // clones the repo into projects dir
    const parsed = parseSourceURI(path)
    const projectsRoot = this.getProjectsRoot()
    const targetName = Path.join(parsed.username, parsed.repository)
    const targetDirectory = Path.join(projectsRoot, parsed.username, parsed.repository)

    await FS.mkdirp(projectsRoot)
    if (await FS.exists(targetDirectory)) {
      this.error(`Directory ${targetDirectory} already exists in Project root`)
    }

    const params = ['clone', `git@github.com:${targetName}`, targetDirectory]
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
}
