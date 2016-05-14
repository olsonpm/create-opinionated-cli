'use strict';


//---------//
// Imports //
//---------//

const CommandArg = require('./command-arg')
  , common = require('./common')
  , fp = require('lodash/fp')
  , utils = require('./utils');


//------//
// Init //
//------//

const createNew = utils.createNew
  , internalArgs = ['help']
  , isDefined = utils.isDefined
  , mutableAssign = utils.mutableAssign
  , mutableAssignAll = utils.mutableAssignAll
  , wrapText = common.wrapText;


//------//
// Main //
//------//

function Command(aValidCommand) {
  const vc = aValidCommand;
  mutableAssignAll(this, [vc, {
    name: vc.name || vc.fn.name
    , args: fp.map(createNew(CommandArg), vc.args)
  }]);
}

mutableAssign(Command.prototype, {
  getAliasBarName: function getAliasBarName() {
    return (this.alias)
      ? this.alias + ' | ' + this.name
      : this.name;
  }
  , getDescLine: function getDescLine(padLength) {
    // padLength is the padding required between command name and description.
    //   multiLinePadLength is the padding required for subsequent wrapped lines,
    //   which ends up being padLength plus the initial two space tab
    const multiLineLeftIndent = padLength + 2;

    return '  ' // two space tab
      + fp.padEnd(padLength, this.getAliasBarName()) // name + padding
      + wrapText(this.desc, multiLineLeftIndent); // properly wrapped description
  }
  , getArgsResult: function getArgsResult() {
    return fp.flow(
      fp.filter(anArg => isDefined(anArg.value) && notInternalArg(anArg))
      , fp.reduce(
        (res, curArg) => fp.set(curArg.name, curArg.value, res)
        , {}
      )
    )(this.args);
  }
});


//-------------//
// Helper Fxns //
//-------------//

function notInternalArg(anArg) {
  return !fp.includes(anArg.name, internalArgs);
}


//---------//
// Exports //
//---------//

module.exports = Command;
