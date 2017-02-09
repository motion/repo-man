// @flow

import Command from '../command'
import Path from 'path'

export default class EjectCommand extends Command {
  name = 'eject [source]'
  description = 'Move files at path to to-org and track'

  async run(_: Object, source: string = '.') {
    const { Color } = this.utils

    await this.ensureProjectsRoot()

    const sourcePath = Path.resolve(source)
    const sourcePathList = sourcePath.split(Path.sep)
    const sourceName = sourcePathList[sourcePathList.length - 1]

    this.log(`Ejecting ${Color.white(sourceName)}...\n`)

    const orgs = await this.getOrganizations()
    const orgOpts = orgs.map(({ name, path }) => ({ name, value: path }))

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const answer = await this.utils.prompt(`Select folder ${projectsPath}/_____`, orgOpts)
    const org = orgs[orgs.findIndex(x => x.path === answer)]

    const targetDirectory = Path.join(org.path, sourceName)

    this.log(`\nEjecting to ${Color.white(targetDirectory)}\n`)

    this.log(`Successfully ejected '${sourcePath}' to '${targetDirectory}'`)
  }
}
