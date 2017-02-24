// @flow

import Command from '../command'

export default class ExecCommand extends Command {
  name = 'exec <command> [parameters...]'
  description = 'Run command in projects'
  options = [
    ['--scope <pattern>', 'Limit to packages that match comma separated pattern (eg package-name or org/repo or org/repo/package-name or org/* or *)'],
    ['--ignore <pattern>', 'Ignore packages that match pattern (eg package-name or org/repo or org/repo/package-name or org/*)'],
    ['--parallel', 'Execute tasks in parallel', false],
    ['--project-root', 'Execute commands in project roots instead of packages', false],
  ]

  async run(options: Object, command: string, parameters: Array<string>) {
    if (options.projectRoot) {
      await this.runProjects(options, command, parameters)
    } else {
      await this.runPackages(options, command, parameters)
    }
  }
  async runProjects(options: Object, command: string, parameters: Array<string>) {
    let projects = await this.getProjects()

    if (options.scope) {
      projects = this.matchProjects(projects, this.helpers.split(options.scope, ','))
    }
    if (options.ignore) {
      const ignored = this.matchProjects(projects, this.helpers.split(options.ignore, ','))
      projects = projects.filter(i => ignored.indexOf(i) === -1)
    }

    if (options.parallel) {
      await Promise.all(projects.map(project => this.spawn(command, parameters, {
        cwd: project.path,
        stdio: ['inherit', 'inherit', 'inherit'],
      }, project)))
    } else {
      for (const project of projects) {
        await this.spawn(command, parameters, {
          cwd: project.path,
          stdio: ['inherit', 'inherit', 'inherit'],
        }, project)
      }
    }
  }
  async runPackages(options: Object, command: string, parameters: Array<string>) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, this.helpers.split(options.scope, ','))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, this.helpers.split(options.ignore, ','))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }

    if (options.parallel) {
      await Promise.all(packages.map(pkg => this.spawn(command, parameters, {
        cwd: pkg.path,
        stdio: ['inherit', 'inherit', 'inherit'],
      }, pkg.project)))
    } else {
      for (const pkg of packages) {
        await this.spawn(command, parameters, {
          cwd: pkg.path,
          stdio: ['inherit', 'inherit', 'inherit'],
        }, pkg.project)
      }
    }
  }
}
