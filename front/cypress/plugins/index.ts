/**
 * @type {Cypress.PluginConfig}
 */
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const registerCodeCoverageTasks = require('@cypress/code-coverage/task');

 export default (on, config) => {
   return registerCodeCoverageTasks(on, config);
 };
