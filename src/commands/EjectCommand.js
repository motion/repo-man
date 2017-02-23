// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import copy from 'sb-copy'
import Command from '../command'
import * as Helpers from '../helpers'

export default class EjectCommand extends Command {
  name = 'eject [directories...]'
  description = 'Move specified directories into repoman Projects root'

  async run({ config }: Object, list: Array<string>) {
    const directories = (list.length ? list : ['.']).map(e => Path.resolve(e))
    const { Color, Figure, tildify: tld } = this.helpers

    const ejects = []
    for (const dir of directories) {
      ejects.push(
        await this.eject(config, dir)
      )
    }
    for (const { directory, targetDir, skipped } of ejects) {
      if (skipped) {
        this.log(Color.blackBright(`Skipping ${this.helpers.tildify(targetDir)} because it already exists`))
      } else {
        this.log(`${Color.white(tld(directory))} ${Figure.arrowRight} ${Color.yellow.bold(tld(targetDir))}`)
      }
    }
    this.log('All requested directories processed 👍')
  }
  async eject(config: string, directory: string) {
    const { tildify, prompt } = this.helpers

    const sourceName = Path.basename(directory)

    const orgs = await this.getOrganizations()

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const prefixPath = tildify(projectsPath)
    const orgOpts = orgs.map(({ name, path }) => ({
      name: `${new Array(prefixPath.length + 2).fill().join(' ')}${name}`,
      value: path,
    }))
    const answerOrg = await prompt(`${prefixPath}/_____/${sourceName}`, orgOpts)
    const org = orgs[orgs.findIndex(x => x.path === answerOrg)]
    const targetDir = Path.join(org.path, sourceName)

    if (await FS.exists(targetDir)) {
      return { directory, targetDir, skipped: true }
    }

    await copy(directory, targetDir)

    let finalConfig = config
    if (!config) {
      finalConfig = await prompt.input('Config source (git url or github/repo)?')
    }

    // add config
    if (finalConfig) {
      const configFile = await ConfigFile.get(Path.join(targetDir, Helpers.CONFIG_FILE_NAME))
      await configFile.set('configurations', [finalConfig])
    }

    return { directory, targetDir, skipped: false }
  }
}
