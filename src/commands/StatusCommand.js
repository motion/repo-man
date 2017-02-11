// @flow
import Command from '../command'
import type { Project } from '../types'
const { all } = Promise

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'

  async run(_) {
    const { Table, Color, Figure, Symbol, tildify } = this.utils

    const projectPaths = await this.getProjects()
    const showNpm = !!Object.keys(_).filter(x => x === 'npm').length
    const projects = await all(
      projectPaths.map(entry => this.getProjectDetails(entry, showNpm))
    )

    const head = [
      '  project',
      'changes',
      'branch',
      showNpm && 'npm',
      'path',
    ]
      .filter(x => !!x)
      .map(c => Color.xterm(247)(c))


    const { min, round } = Math
    const getWidth = () =>
      min(30, round((process.stdout.columns / head.length) * 0.9))
    const colWidths = head.map(getWidth)
    const table = new Table({ head, colWidths })
    const gray = Color.xterm(8)

    // preview
    const preview = new Table({ head, colWidths })
    const rows = await all(projects.map(() => this.getRow()))
    rows.forEach(r => preview.push(r))
    this.log(preview.print())

    // response
    const final = await all(projects.map(this.getRow))
    final.forEach(r => table.push(r))
    this.log(table.print())
  }

  getRow = async (project:? Project) => {
    const gray = Color.xterm(8)

    if (!project) {
      projects.length
    }

    const repo = project.repository
    const isGit = typeof repo.clean !== 'undefined'
    const none = gray('  -  ')
    const path = gray(tildify(project.path))

    let response
    const version = showNpm ? project.version || none : none

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
