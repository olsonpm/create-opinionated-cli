'use strict';


//---------//
// Imports //
//---------//

const madonna = require('madonna-fp');


//------//
// Init //
//------//

const madonnaFnArgsValidator = madonna.createIdentityValidator(getMadonnaFnMarg());


//------//
// Main //
//------//

function madonnaFn(argsObj) {
  madonnaFnArgsValidator.apply(null, arguments);

  const fnArgsValidator = madonna.createIdentityValidator(argsObj.marg);

  const res = function() {
    fnArgsValidator.apply(null, arguments);
    // no errors - return the result of the applied function
    return argsObj.fn.apply(argsObj.ctx, arguments);
  };

  if (argsObj.name) Object.defineProperty(res, 'name', { value: name });

  return res;
}


//-------------//
// Helper Fxns //
//-------------//

function getMadonnaFnMarg() {
  return {
    marg: ['require', 'isLadenPlainObject']
    , fn: ['require', 'isFunction']
    , ctx: ['isDefined']
    , name: ['isLadenString']
  };
}


//---------//
// Exports //
//---------//

module.exports = madonnaFn;
