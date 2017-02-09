// @flow
import Command from '../command'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'

  async run() {
    const projectPaths = await this.getProjects()
    const projects = await Promise.all(projectPaths.map(entry => this.getProjectDetails(entry)))
    const { Table, Color, Figure, Symbol } = this.utils

    const head = [
      '  project',
      'changes',
      'branch',
      'npm',
      'path',
    ].map(c => Color.xterm(247)(c))

    const table = new Table({ head })
    const gray = Color.xterm(8)

    table.push(...projects.map(function(project) {
      const repo = project.repository
      const DIRTY_FLAG = repo.clean ? Symbol.check : Symbol.x
      return [
        `${DIRTY_FLAG} ${project.name}`,
        repo.filesDirty + repo.filesUntracked,
        `${Color.yellow(repo.localBranch)} ${gray(Figure.arrowRight)} ${repo.remoteBranch}`,
        project.package.version || gray('-none-'),
        gray(project.path),
      ]
    }))

    this.log(table.print())
  }
}
