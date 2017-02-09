# RepoMan

> a sane way to manage lots of open source packages

RepoMan is a tool that helps you manage lots of packages, whether you are
ejecting them from a mono-repo, or just want an easier way to maintain your
many repos.

It is primarily focused on node packages to start, adding helpers for linking
them all together and publishing them, but eventually will be pluggable.

## Installation

> ⚠️ note: repo-man NOT repoman ⚠️

```sh
npm i -g repo-man
```

## Usage

For a list of all commands and their details:

```sh
repoman help
```

Useful commands:

- `repoman init` to set up your projects folder
- `repoman track` to track any folder on your system
- `repoman eject` to pull a folder into your repoman projects folder
- `repoman status` to see your projects
- `repoman link` to npm link your projects together
- `repoman run [command]` to run any command from your package.json
- `repoman publish [org]` to publish all your packages, like [lerna](https://github.com/lerna/lerna)

## What it solves

Repoman wants to solve one general big problem:

> I don't want to have any extra pain going from managing 1 to N open source packages

To get there you need:

1. Avoid the pain of copy/pasting tons of dotfiles around
2. Avoid the pain of linking together modules
3. Avoid the pain of releasing all your modules
4. Avoid the pain of syncing your repos all up/down

Separately, if you are working on a team, you need the concept of a **set of repos** that everyone is using.
And finally, you likely have a parent **mono repo** that these repos all connect into.

To make this all possible, repoman has the concept of a *set* of repos, or a *reposet*,
as well as your workspace.

So you have your workspace:

```sh
~/projects
```

and then you have your sets:

```sh
~/projects/[set]
```

which then contain all your packages:

```sh
~/projects/[set]/[package]
```
