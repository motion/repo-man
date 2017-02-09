// @flow

export type Options = {
  stateDirectory: string,
}

export type Command = {
  name: string,
  callback: Function,
  description: string,
}

export type Project = {
  name: string,
  path: string,
  dependencies: Array<string>,
  configurations: Array<string>,
}
