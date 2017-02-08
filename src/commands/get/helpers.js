// @flow

import { RepoManError } from '../../helpers'

// TODO(steelbrain): Make this url parser a separate module
const REGEX_URI_SCHEME_1 = /^([0-9a-z-_]+\/[0-9a-z-_]+)(#[a-f0-9]+)?$/i
// ^ username/repo username/repo#commit
const REGEX_URI_SCHEME_2 = /^([^:\/\/]+):\/\/([^.]+\.[^:]+(\/|:)[^\/]+\/.+)(#.+)?$/
// ^ https://github.com/username/repo git://github.com:username/repo#commit
const REGEX_URI_SCHEME_3 = /^([^.\/]+\.[^:]+(:|\/)[^\/]+\/.+)(#.+)?$/
// ^ github.com:username/repo github.com/username/repo#commit
export function parseSourceURI(given: string): { uri: string, tag: ?string } {
  let uri = ''
  let tag = null
  let protocol = ''
  if (REGEX_URI_SCHEME_1.test(given)) {
    const matched = REGEX_URI_SCHEME_1.exec(given)
    uri = `github.com:${matched[1]}`
    protocol = 'git:'
    if (matched[2]) {
      // Remove the hash in front
      tag = matched[2].slice(1)
    }
  } else if (REGEX_URI_SCHEME_2.test(given)) {
    const matched = REGEX_URI_SCHEME_2.exec(given)
    uri = matched[2]
    protocol = matched[1] + ':'
    if (matched[4]) {
      // Remove the hash
      tag = matched[4].slice(1)
    }
  } else if (REGEX_URI_SCHEME_3.test(given)) {
    const matched = REGEX_URI_SCHEME_3.exec(given)
    uri = matched[1]
    protocol = 'git:'
    if (matched[3]) {
      // Remove the hash in front
      tag = matched[3].slice(1)
    }
  } else {
    throw new RepoManError(`Invalid source provided '${given}'`)
  }
  let filledURI
  if (protocol === 'git:') {
    filledURI = `git@${uri}`
  } else {
    filledURI = `${protocol}//${uri}`
  }
  return { uri: filledURI, tag }
}

export function getSuggestedDirectoryName(uri: string): string {
  let chunks
  chunks = uri.split(':')
  chunks = chunks[chunks.length - 1].split('/')
  return chunks.slice(-2).join('-')
}
