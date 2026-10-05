/* Banco completo de ARGOS: rutas, máquinas y simulacros. Lo usan la construcción (app/build.js) y las pruebas. */
'use strict';
module.exports = {
  rutas: [require('./ens.js'), require('./iso27001.js'), require('./continuidad.js')],
  maquinas: require('./maquinas.js'),
  simulacros: require('./simulacros.js')
};
