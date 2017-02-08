// @flow

export type Options = {
  stateDirectory: string,
}

export type Command = {
  name: string,
  callback: Function,
  description: string,
}
