'use strict';

//
// README
// - madonna-function depends on this module.  Instead of having


//---------//
// Imports //
//---------//

const common = require('./common')
  , fp = require('lodash/fp')
  , madonna = require('madonna-fp')
  , madonnaFn = require('../../madonna-internal-fn/lib')
  , utils = require('./utils');


//------//
// Init //
//------//

const createError = common.createError
  , madonnaMapMarg = getMadonnaMapMarg()
  , mapValuesWithKey = utils.mapValuesWithKey;


//------//
// Main //
//------//

const createMapperExport = madonnaFn({
  marg: madonnaMapMarg
  , fn: createMapper
});

function createMapper(argsObj) {
  const argValidator = madonna.createSternValidator(argsObj.marg);

  return function(dirtyArgs) {
    argValidator.apply(null, arguments);

    // no errors, return the mapped results
    const argMap = argsObj.argMap;
    return fp.flow(
      fp.pick(fp.keys(argMap))
      , mapValuesWithKey((val, key) => argMap[key](val))
      , fp.assign(dirtyArgs)
    )(dirtyArgs);
  };
}


//-------------//
// Helper Fxns //
//-------------//

function getMadonnaMapMarg() {
  return {
    schema: {
      marg: ['require', 'isLadenPlainObject']
      , argMap: {
        flags: ['require', 'isLadenPlainObject']
        , custom: {
          allFunctions: fp.all(fp.isFunction)
        }
      }
    }
    , opts: {
      cb: furtherValidateMadonnaMap
    }
  };
}

function furtherValidateMadonnaMap(argsObj) {
  const keysAllowed = fp.keys(margToLonghand(argsObj.marg).schema);
  const keysToTest = fp.keys(argsObj.argMap);

  // argMap must only contain keys contained within the first level of schema
  const invalidKeys = fp.difference(keysToTest, keysAllowed);
  if (invalidKeys.length) {
    throw createError(
      'Invalid Input'
      , "argMap can only contain keys present in schema.\n"
        + "invalid keys: " + invalidKeys.join(', ') + "\n"
        + "keys allowed: " + keysAllowed.join(', ')
      , 'invalid-keys'
      , {
        invalidKeys: invalidKeys
        , keysAllowed: keysAllowed
      }
    );
  }

  return {
    isValid: true
  };
}

// These two functions should really exist in madonna-fp, just unsure how the
//   api should look.
function margToLonghand(marg) {
  if (margIsShorthand(marg)) {
    marg = { schema: marg, opts: {} };
  }
  return marg;
}
function margIsShorthand(marg) {
  return !marg.schema;
}


//---------//
// Exports //
//---------//

module.exports = {
  createMapper: createMapperExport
};
