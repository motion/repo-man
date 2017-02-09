// @flow

import Command from '../command'
import Path from 'path'

export default class EjectCommand extends Command {
  name = 'eject [source]'
  description = 'Move files at path to to-org and track'

  async run(_: Object, source: string = '.') {
    await this.ensureProjectsRoot()
    const { Color, tildify } = this.utils

    const sourceDir = Path.resolve(source)
    const sourceDirList = sourceDir.split(Path.sep)
    const sourceName = sourceDirList[sourceDirList.length - 1]

    this.log(`Ejecting ${Color.white(sourceName)}...\n`)

    const orgs = await this.getOrganizations()
    const orgOpts = orgs.map(({ name, path }) => ({ name, value: path }))

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const answer = await this.utils.prompt(`Move to: ${tildify(projectsPath)}/_____/${sourceName}`, orgOpts)

    this.newline()

    const org = orgs[orgs.findIndex(x => x.path === answer)]
    const targetDir = Path.join(org.path, sourceName)

    if (await this.fs.exists(targetDir)) {
      this.error(`Already exists! ${tildify(targetDir)}`)
    }

    this.log(`Ejecting to ${Color.white(targetDir)}\n`)

    await this.fs.rename(sourceDir, targetDir)

    this.log(`Successfully ejected '${tildify(sourceDir)}' to '${tildify(targetDir)}'`)
  }
}
