'use strict';


//---------//
// Imports //
//---------//

const fp = require('lodash/fp');


//------//
// Init //
//------//

const mutableSet = getMutableSet();


//------//
// Main //
//------//

const defineProp = fp.curry(
  (name, desc, obj) => Object.defineProperty(obj, name, desc)
);

const mapValuesWithKey = fp.ary(2, fp.mapValues.convert({ cap: false }));


//-------------//
// Helper Fxns //
//-------------//

function getMutableSet() { return fp.set.convert({ immutable: false }); }

//---------//
// Exports //
//---------//

module.exports = {
  defineProp: defineProp
  , mapValuesWithKey: mapValuesWithKey
  , mutableSet: mutableSet
};
