// @flow

import FS from 'sb-fs'
import Command from '../command'
import Path from 'path'
import { ensureDoesntExist } from '../helpers'

export default class EjectCommand extends Command {
  name = 'eject <org> [source] [dest]'
  description = 'Move files at path to to-org and track'

  async run(org: Object, source: string, dest: string) {
    console.log(org, source)
    const projectsRoot = this.getProjectsRoot()

    const pathList = source.split(Path.sep)
    const targetName = dest || pathList[pathList.length - 1]
    const targetDirectory = Path.join(projectsRoot, org, targetName)
    console.log('to', targetName, targetDirectory)

    await FS.mkdirp(projectsRoot)
    await ensureDoesntExist(targetDirectory)

    this.log(`Successfully ejected '${targetName}'`)
  }
}
