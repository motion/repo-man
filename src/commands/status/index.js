// @flow

export const name = 'status'
export const description = 'Get status of your projects'
export async function callback() {
  const projectPaths = await this.getProjects()
  const projects = await Promise.all(projectPaths.map(entry => this.getProjectDetails(entry)))
  console.log('projects', projects)
}
