'use strict';

/**
 * @description
 * DOING: Should import or include the required
 * libraries and files for this script to run.
 */
const handlers = require('./lib/handlers/');

/**
 * @function anonymous
 * @access public
 *
 * @description
 * DOING: Should export the handler to the
 * proxy from the factory being exposed.
 *
 * @param {Object} config - expected handler config
 * @returns {Object.<Promise>}
 */
module.exports = config => {

  if(typeof config !== 'object' || !config.hasOwnProperty('handler')) {
    throw new Error('Missing params. Quitting now');
  }

  /**
   * @description
   * DOING: Should define the handlers available
   * for the proxy to use.
   */
  const factory = {
    migrate: () => handlers.migrate(config.params)
  };


  if(!Object.keys(factory).includes(`${config.handler}`)) {
    throw new Error('No valid handler found. Quitting now.');
  }

  return factory[config.handler];
};
