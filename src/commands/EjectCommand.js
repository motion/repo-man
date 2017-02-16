// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import copy from 'sb-copy'
import Command from '../command'
import * as Helpers from '../helpers'

export default class EjectCommand extends Command {
  name = 'eject [directories...]'
  description = 'Move files at path to to-org and track'

  async run({ config }: Object, ...list: Array<string>) {
    const directories = list || ['.']
    const { Color, Figure, tildify: tld } = this.helpers

    await this.ensureProjectsRoot()
    const ejects = []
    for (const dir of directories) {
      ejects.push(
        await this.eject(config, dir)
      )
    }
    for (const { sourceDir, targetDir, skipped } of ejects) {
      if (skipped) {
        this.log(`${Color.white(tld(sourceDir))} skipped`)
      } else {
        this.log(`${Color.white(tld(sourceDir))} ${Figure.arrowRight} ${Color.yellow.bold(tld(targetDir))}`)
      }
    }
    this.log('👍')
    this.log(`${directories.join(' ')}`)
  }
  async eject(config: string, directory: string) {
    const { Color, tildify, prompt } = this.helpers

    const sourceDir = Path.resolve(directory)
    const sourceDirList = sourceDir.split(Path.sep)
    const sourceName = sourceDirList[sourceDirList.length - 1]

    const orgs = await this.getOrganizations()

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const prefixPath = tildify(projectsPath)
    const orgOpts = orgs.map(({ name, path }) => ({
      name: `${new Array(prefixPath.length + 2).fill().join(' ')}${name}`,
      value: path,
    }))
    const answerOrg = await prompt(`${prefixPath}/_____/${sourceName}`, orgOpts)
    this.newline()

    const org = orgs[orgs.findIndex(x => x.path === answerOrg)]
    const targetDir = Path.join(org.path, sourceName)

    if (await FS.exists(targetDir)) {
      this.log(Color.blackBright(`Skipping ${tildify(targetDir)}`))
      return { sourceDir, targetDir, skipped: true }
    }

    await copy(sourceDir, targetDir)

    let finalConfig = config
    if (!config) {
      this.log('Config source? (git url or github/repo)')
      finalConfig = await prompt.input(':')
    }

    // add config
    if (finalConfig) {
      const configFile = new ConfigFile(Path.join(targetDir, Helpers.CONFIG_FILE_NAME))
      configFile.set('configurations', [finalConfig])
    }

    return { sourceDir, targetDir, skipped: false }
  }
}
