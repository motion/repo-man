// @flow

export type Options = {
  stateDirectory: string,
}

export type GitState = {
  clean: boolean,
  branchLocal: string,
  branchRemote: string,
  filesDirty: number,
  filesUntracked: number,
}

export type Repository = {
  path: string,
} & GitState

export type NpmInfo = {
  name: string,
  version: string,
  description: string,
}

export type Project = {
  name: string,
  path: string,
  npm: NpmInfo,
  repository: Repository,
  dependencies: Array<string>,
  configurations: Array<string>,
}

export type Organization = {
  name: string,
  path: string,
}

export type ParsedRepo = {
  username: string,
  repository: string,
  tag: ?string,
  subfolder: ?string,
}
