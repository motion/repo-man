// @flow

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'
import * as Helpers from '../helpers'
import ConfigFile from 'sb-config-file'

export default class EjectCommand extends Command {
  name = 'eject [source]'
  description = 'Move files at path to to-org and track'

  async run({ config }, source: string = '.') {
    await this.ensureProjectsRoot()
    const { Color, tildify, prompt } = this.utils
    const sourceDir = Path.resolve(source)
    const sourceDirList = sourceDir.split(Path.sep)
    const sourceName = sourceDirList[sourceDirList.length - 1]

    this.log(`Ejecting ${Color.white(sourceName)}...\n`)

    const orgs = await this.getOrganizations()
    const orgOpts = orgs.map(({ name, path }) => ({ name, value: path }))

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const answer = await prompt(`Move to: ${tildify(projectsPath)}/_____/${sourceName}`, orgOpts)

    this.newline()

    let finalConfig = config
    if (!config) {
      this.log('Config source? (any git repo, or Github shorthand)')
      finalConfig = await prompt.input(':')
    }

    const org = orgs[orgs.findIndex(x => x.path === answer)]
    const targetDir = Path.join(org.path, sourceName)

    if (await FS.exists(targetDir)) {
      this.error(`Already exists! ${tildify(targetDir)}`)
    }

    this.log(`Ejecting to ${Color.white(targetDir)}\n`)

    // move
    await FS.rename(sourceDir, targetDir)

    // add config
    if (finalConfig) {
      const configFile = new ConfigFile(Path.join(targetDir, Helpers.CONFIG_FILE_NAME))
      configFile.set('configurations', [finalConfig])
    }

    this.log(`Successfully ejected '${tildify(sourceDir)}' to '${tildify(targetDir)}'`)
  }
}
