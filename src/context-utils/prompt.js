import inquirer from 'inquirer'

export default async function prompt(message, choices, options = {}) {
  const { list } = await inquirer.prompt({
    type: 'list',
    name: 'list',
    ...options,
    choices,
    message,
  })
  return list
}
