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
      this.row('  project'),
      this.row('changes'),
      this.row('branch'),
      this.row(his.showNpm && 'npm'),
      this.row('path'),
    ]
      .filter(x => !!x)
      .map(c => this.utils.Color.xterm(247)(c))

    const { min, round } = Math
    const columns = process.stdout.columns
    const getWidth = () => min(30, round((columns / head.length) * 0.9))
    const colWidths = head.map(getWidth)
    const table = new this.utils.Table({ head, colWidths })

    // response
    const final = await Promise.all(projects.map(this.getRow))
    final.forEach(r => table.push(r))
    this.log(table.print())
  }

  row = (content, props) => ({ content, ...props })
  crow = content => this.row(content, { hAlign: 'center' })

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
        row(`${isDirty} ${project.name}`),
        row(numChanged || none),
        row(`${Color.yellow(repo.branchLocal)} ${gray(Figure.arrowRight)} ${repo.branchRemote}`),
        row(version),
        row(path),
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
