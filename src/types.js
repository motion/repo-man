// @flow

export type Options = {
  stateDirectory: string,
}

export type ProjectState = {
  org: string,
  name: string,
  path: string,
  packages: Array<string>,
  dependencies: Array<string>,
  configurations: Array<string>,
}

export type Project = {
  org: string,
  name: string,
  path: string,
}

export type Organization = {
  name: string,
  path: string,
}

export type ParsedRepo = {
  org: string,
  tag: ?string,
  name: string,
  path: string,
  subpath: ?string,
}

export type Package = {
  path: string,
  project: Project,
}

export type NodePackageState = {
  name: string,
  version: string,
  description: string,
  project: Project,
}

export type RepositoryState = {
  clean: boolean,
  project: Project,
  branchLocal: string,
  branchRemote: string,
  filesDirty: number,
  filesUntracked: number,
}
