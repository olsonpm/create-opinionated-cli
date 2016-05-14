'use strict';


//---------//
// Imports //
//---------//

const fp = require('lodash/fp')
  , utils = require('./utils');


//------//
// Init //
//------//

const mSet = utils.mutableSet
  , defineProp = utils.defineProp;


//------//
// Main //
//------//

const createError = (name, msg, id, data) => {
  return fp.flow(
    mSet('name', name)
    , defineProp('id', { enumerable: true, value: 'map_' + id })
    , (data)
      ? defineProp('data', { enumerable: true, value: data })
      : fp.identity
  )(new Error(msg));
};


//-------------//
// Helper Fxns //
//-------------//



//---------//
// Exports //
//---------//

module.exports = {
  createError: createError
};
