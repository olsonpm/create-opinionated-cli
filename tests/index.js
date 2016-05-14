'use strict';


//---------//
// Imports //
//---------//

const chai = require('chai')
  , createCli = require('../lib')
  , fp = require('lodash/fp')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai');


//------//
// Init //
//------//

chai.should();
chai.use(sinonChai);


//------//
// Main //
//------//

describe('createSafeFn', function() {
  it('should require a single argument', function() {});
});
