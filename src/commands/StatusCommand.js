// @flow
import Command from '../command'
import type { Project } from '../types'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'

  async run(_) {
    this.showNpm = !!Object.keys(_).filter(x => x === 'npm').length

    const projectPaths = await this.getProjects()
    const projects = await Promise.all(
      projectPaths.map(entry => this.getProjectDetails(entry, this.showNpm))
    )

    const head = [
      '  project',
      'changes',
      'branch',
      this.showNpm && 'npm',
      'path',
    ]
      .filter(x => !!x)
      .map(c => this.utils.Color.xterm(247)(c))

    const { min, round } = Math
    const getWidth = () =>
      min(30, round((process.stdout.columns / head.length) * 0.9))
    const colWidths = head.map(getWidth)
    const table = new this.utils.Table({ head, colWidths })

    // response
    const final = await Promise.all(projects.map(this.getRow))
    final.forEach(r => table.push(r))
    this.log(table.print())
  }

  getRow = async (project:? Project) => {
    const { Color, Figure, Symbol, tildify } = this.utils

    const gray = Color.xterm(8)
    const repo = project.repository
    const isGit = typeof repo.clean !== 'undefined'
    const none = gray('  -  ')
    const path = gray(tildify(project.path))

    let response
    const version = this.showNpm ? project.version || none : false

    if (isGit) {
      const isDirty = repo.clean ? Symbol.check : Symbol.x
      const numChanged = repo.filesDirty + repo.filesUntracked
      response = [
        `${isDirty} ${project.name}`,
        numChanged || none,
        `${Color.yellow(repo.branchLocal)} ${gray(Figure.arrowRight)} ${repo.branchRemote}`,
        version,
        path,
      ]
    }
    else {
      response = [
        `  ${project.name}`,
        none,
        none,
        version,
        path,
      ]
    }
    return response.filter(x => !!x)
  }
}
