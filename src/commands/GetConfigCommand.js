// @flow

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class GetConfigCommand extends Command {
  name = 'get.config <remote_path>'
  description = 'Clone the given path into configs root'

  async run(options: Object, path: string) {
    // clones the repo into projects dir
    const configsRoot = this.getConfigsRoot()
    const parsed = parseSourceURI(configsRoot, path)

    if (await FS.exists(parsed.path)) {
      // TODO: Git pull instead of removing maybe?
      this.log(`Replacing old config at ${this.helpers.tildify(parsed.path)}`)
      await FS.rimraf(parsed.path)
    }
    await FS.mkdirp(Path.dirname(parsed.path))

    const cloneExitCode = await this.spawn('git', ['clone', `git@github.com:${parsed.org}/${parsed.name}`, parsed.path], { cwd: configsRoot, stdio: 'inherit' })
    if (cloneExitCode !== 0) {
      process.exitCode = 1
      return
    }
    if (parsed.tag) {
      const tagExitCode = await this.spawn('git', ['checkout', parsed.tag], { cwd: parsed.path, stdio: 'ignore' })
      if (tagExitCode !== 0) {
        process.exitCode = 1
        return
      }
    }
    this.log(`Successfully downloaded '${parsed.org}/${parsed.name}'`)
  }
}
