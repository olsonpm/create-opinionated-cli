'use strict';


//---------//
// Imports //
//---------//

const chai = require('chai')
  , fp = require('lodash/fp')
  , madonna = require('madonna-fp')
  , madonnaMap = require('../lib');


//------//
// Init //
//------//

chai.should();
const errorIds = madonna.ERROR_IDS.validate;


//------//
// Main //
//------//

describe('createMapper', () => {
  it('should correctly map the argument', () => {
    const mapper = madonnaMap.createMapper({
      marg: {
        name: ['require', 'isLadenString']
        , age: {
          flags: ['isInteger']
          , betweenI: [0, 120]
        }
      }
      , argMap: {
        name: fp.toUpper
      }
    });

    mapper({ name: 'phil' }).should.deep.equal({ name: 'PHIL' });

    mapper({ name: 'phil', age: 28 }).should.deep.equal({ name: 'PHIL', age: 28 });
  });
  it('should throw correct errors', () => {
    const mapper = madonnaMap.createMapper({
      marg: { name: ['require', 'isLadenString'] }
      , argMap: {
        name: fp.toUpper
      }
    });

    let err;
    try { mapper({ name: { notALadenString: 'fail' } }); }
    catch(e) { err = e; }
    err.id.should.equal(errorIds.criterionFailed);
    err = undefined;

    try {
      madonnaMap.createMapper({
        marg: { name: ['require', 'isLadenString'] }
        , argMap: {
          age: fp.toString
        }
      });
    }
    catch(e) { err = e; }
    err.id.should.equal('map_invalid-keys');
  });
});
