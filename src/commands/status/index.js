// @flow

export const name = 'status'
export const description = 'Get status of your projects'
export async function callback() {
  const projectPaths = await this.getProjects()
  const projects = await Promise.all(projectPaths.map(entry => this.getProjectDetails(entry)))
  const { Table, Color, Figure, Symbol } = this.utils

  const head = ['project', 'changes', `local ${Figure.arrowRight} remote`, 'npm', 'path'].map(c => Color.cyan(c))
  const table = new Table({ head })

  table.push(...projects.map(function(project) {
    const repo = project.repository
    const DIRTY_FLAG = repo.clean ? Symbol.check : Symbol.x

    return [
      `${DIRTY_FLAG} ${project.name}`,
      repo.filesDirty + repo.filesUntracked,
      `${Color.yellow(repo.localBranch)} ${Figure.arrowRight} ${repo.remoteBranch}`,
      project.package.version || '-none-',
      Color.xterm(8)(project.path),
    ]
  }))

  this.log(table.print())
}
