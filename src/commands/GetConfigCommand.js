// @flow

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class GetConfigCommand extends Command {
  name = 'get-config <remote_path>'
  description = 'Clone the given path into configs root'

  async run(_: Object, path: string) {
    this.silent = _.silent
    // clones the repo into projects dir
    const parsed = parseSourceURI(path)
    const projectsRoot = this.getConfigsRoot()
    const targetName = Path.join(parsed.username, parsed.repository)
    const targetDirectory = Path.join(projectsRoot, parsed.username, parsed.repository)

    await FS.mkdirp(projectsRoot)
    if (await FS.exists(targetDirectory)) {
      this.log(`Replacing old config at ${targetDirectory}`)
      await FS.rimraf(targetDirectory)
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
