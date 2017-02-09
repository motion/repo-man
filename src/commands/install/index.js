// @flow

// import FS from 'fs'
import { RepoManError } from '../../helpers'

export const name = 'install'
export const description = 'Install current project dependencies'
export async function callback() {
  const currentProjectPath = await this.getCurrentProjectPath()
  if (!currentProjectPath) {
    throw new RepoManError('Current directory is not a Repoman project')
  }
  const currentProject = await this.getProjectDetails(currentProjectPath)
  console.log('projects', currentProject)
}
