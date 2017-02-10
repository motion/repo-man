// @flow
import Command from '../command'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'

  async run({ npm }) {
    const { Table, Color, Figure, Symbol, tildify } = this.utils

    const projectPaths = await this.getProjects()
    const projects = await Promise.all(
      projectPaths.map(entry =>
        this.getProjectDetails(entry, npm)
      )
    )

    let head = [
      '  project', 'changes', 'branch', 'path',
    ]
    if (npm) {
      head.push('npm version')
    }
    head = head.map(Color.xterm(247))

    const table = new Table({ head })
    const gray = Color.xterm(8)

    table.push(...projects.map(function(project) {
      const repo = project.repository
      const isGit = typeof repo.clean !== 'undefined'
      const none = gray('-none-')
      const version = project.version || none
      const path = gray(tildify(project.path))

      if (isGit) {
        const isDirty = repo.clean ? Symbol.check : Symbol.x
        const numChanged = repo.filesDirty + repo.filesUntracked
        return [
          `${isDirty} ${project.name}`,
          numChanged,
          `${Color.yellow(repo.branchLocal)} ${gray(Figure.arrowRight)} ${repo.branchRemote}`,
          path,
          version,
        ]
      }
      else {
        return [
          `  ${project.name}`,
          none,
          none,
          version,
          path,
        ]
      }
    }))

    this.log(table.print())
  }
}
