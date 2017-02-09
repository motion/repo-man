// @flow

import FS from 'sb-fs'
import Command from '../command'
import Path from 'path'
import { ensureDoesntExist } from '../helpers'

export default class EjectCommand extends Command {
  name = 'eject [source]'
  description = 'Move files at path to to-org and track'

  async run(_: Object, source: string = '.') {
    const orgs = await this.getOrganizations()

    // prompt for org to eject to
    const targetDirectory = await this.utils.prompt('Select organization', orgs)

    const pathList = targetDirectory.split(Path.sep)
    const targetName = pathList[pathList.length - 1]

    const projectsRoot = this.getProjectsRoot()
    await FS.mkdirp(projectsRoot)
    await ensureDoesntExist(targetDirectory)

    this.log(`Successfully ejected '${targetName}'`)
  }
}
