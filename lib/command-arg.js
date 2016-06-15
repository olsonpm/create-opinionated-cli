'use strict';


//---------//
// Imports //
//---------//

const common = require('./common')
  , fp = require('lodash/fp')
  , utils = require('./utils');


//------//
// Init //
//------//

const mutableAssign = utils.mutableAssign
  , wrapText = common.wrapText;


//------//
// Main //
//------//

function CommandArg(aSafeCommandArg) {
  mutableAssign(this, aSafeCommandArg);

  // all boolean args should default to false
  if (this.type === 'boolean') this.value = false;
}

mutableAssign(CommandArg.prototype, {
  getCliAlias: function getCliAlias() {
    return '-' + this.alias;
  }
  , getCliName: function getCliName() {
    return '--' + fp.kebabCase(this.name);
  }
  , isCliAliasOrName: function isCliAliasOrName(cliArg) {
    return (fp.get('length', cliArg) === 2)
      ? this.getCliAlias() === cliArg
      : this.getCliName() === cliArg;
  }
  , isMissing: function isMissing() {
    return this.isRequired() && fp.isUndefined(this.value);
  }
  , isRequired: function isRequired() {
    return fp.includes('require', this.flags);
  }
  , getAliasBarName: function getAliasBarName() {
    return (this.alias)
      ? `-${this.alias}|${this.getCliName()}`
      : `${this.getCliName()}`;
  }
  , getDescLine: function getDescLine(padLength, maxTypeStrLength) {
    // padLength is the padding required between command name and description.
    //   multiLineLeftIndent is the padding required for subsequent wrapped lines,
    //   which ends up being padLength plus the initial two space tab
    const multiLineLeftIndent = padLength + 2;
    const desc = '{' + this.type + '} '
      + fp.repeat(maxTypeStrLength - this.type.length, ' ')
      + this.desc;
    return '  ' // two space tab
      + fp.padEnd(padLength, this.getAliasBarName()) // name + padding
      + wrapText(desc, multiLineLeftIndent); // properly wrapped description
  }
  , setValue: function setValue(val) {
    this.value = val;
  }
});


//---------//
// Exports //
//---------//

module.exports = CommandArg;
