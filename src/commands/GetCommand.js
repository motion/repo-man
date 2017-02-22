// @flow

import FS from 'sb-fs'
import Command from '../command'
import { parseSourceURI, RepoManError } from '../helpers'

export default class GetCommand extends Command {
  name = 'get <remote_path>'
  description = 'Clone the given path into projects root'

  async run(_: Object, path: string) {
    // clones the repo into projects dir
    const projectsRoot = this.getProjectsRoot()
    const parsed = parseSourceURI(projectsRoot, path)

    await FS.mkdirp(projectsRoot)
    if (await FS.exists(parsed.path)) {
      throw new RepoManError(`Directory ${this.helpers.tildify(parsed.path)} already exists in Project root`)
    }

    const params = ['clone', `git@github.com:${parsed.org}/${parsed.name}`, parsed.path]
    const cloneExitCode = await this.spawn('git', params, { cwd: projectsRoot, stdio: 'inherit' })
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
