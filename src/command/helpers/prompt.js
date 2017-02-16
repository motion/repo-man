import inquirer from 'inquirer'

async function prompt(message, choices, options = {}) {
  const { list } = await inquirer.prompt({
    type: 'list',
    name: 'list',
    ...options,
    choices,
    message,
  })
  return list
}

prompt.input = async function(message) {
  const { input } = await inquirer.prompt({
    type: 'input',
    name: 'input',
    message,
  })
  return input
}

export default prompt
