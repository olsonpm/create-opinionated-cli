'use strict';

//
// README
// - A small wrapper around madonna-internal-fn.  I just want to give consumers
//   the option to map their arguments prior to calling the function.
//


//---------//
// Imports //
//---------//

const fp = require('lodash/fp')
  , madonna = require('madonna-fp')
  , madonnaFn = require('../../madonna-internal-fn/lib')
  , madonnaMap = require('../../madonna-map/lib').createMapper;


//------//
// Init //
//------//

const madonnaFunctionSchema = getMadonnaFunctionSchema();


//------//
// Main //
//------//

const exportCreate = madonnaFn({
  marg: madonnaFunctionSchema
  , fn: create
});

function create(argsObj) {
  const argMap = argsObj.argMap
    , fn = argsObj.fn
    , marg = argsObj.marg
    , name = argsObj.name;

  const validatorFn = (argMap)
    ? madonnaMap({ marg: marg, argMap: argMap})
    : madonna.createIdentityValidator(marg);

  const res = fp.flow(validatorFn, fn);

  if (name) Object.defineProperty(res, 'name', { value: name });

  return res;
}


//-------------//
// Helper Fxns //
//-------------//

// argMap should be getting its schema from madonna-map.  Will fix that later
function getMadonnaFunctionSchema() {
  return {
    marg: ['require', 'isLadenPlainObject']
    , fn: ['require', 'isFunction']
    , name: ['isLadenString']
    , argMap: {
      flags: ['isLadenPlainObject']
      , custom: {
        allFunctions: fp.all(fp.isFunction)
      }
    }
  };
}


//---------//
// Exports //
//---------//

module.exports = {
  create: exportCreate
};
