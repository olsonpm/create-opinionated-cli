module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var appRootPath = __webpack_require__(/*! app-root-path */ 1),
	    Command = __webpack_require__(/*! ./command */ 2),
	    CommandArg = __webpack_require__(/*! ./command-arg */ 3),
	    common = __webpack_require__(/*! ./common */ 4),
	    madonnaFunction = __webpack_require__(/*! madonna-function/es6 */ 9),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    parseCommandArgs = __webpack_require__(/*! ./parse-command-args */ 10),
	    path = __webpack_require__(/*! path */ 11),
	    vCommand = __webpack_require__(/*! ./v-command */ 12),
	    vCommandArg = __webpack_require__(/*! ./v-command-arg */ 13),
	    utils = __webpack_require__(/*! ./utils */ 6);

	//------//
	// Init //
	//------//

	var createCliMarg = getCliMarg(),
	    createMadonnaFn = madonnaFunction.create,
	    pjson = appRootPath.require('package.json'),
	    createError = common.createError,
	    getDuplicateArgProps = common.getDuplicateArgProps,
	    getDuplicateArgsMatching = common.getDuplicateArgsMatching,
	    VIEW_WIDTH = common.VIEW_WIDTH,
	    wrapText = common.wrapText,
	    createNew = utils.createNew,
	    jstring = utils.jstring,
	    keyToVal = utils.keyToVal;

	//------//
	// Main //
	//------//

	var safeCreateCli = createMadonnaFn({
	  marg: createCliMarg,
	  fn: createCli,
	  argMap: {
	    commands: fp.map(createNew(Command))
	  }
	});

	//-------------//
	// Helper Fxns //
	//-------------//

	function createCli(argsObj) {
	  var entryCommand = fp.flow(fp.split(path.sep), fp.last)(process.argv[1]);
	  argsObj.entryCommand = entryCommand;

	  argsObj.options = getEntryCommandOptions(entryCommand, argsObj);

	  var argv = process.argv.slice(2);

	  if (!argv.length || argv[0] === '') {
	    showHelp(argsObj, 2);
	    return;
	  }

	  var validFirstArgs = getValidFirstArgs(argsObj);

	  if (!fp.includes(argv[0], validFirstArgs)) {
	    console.error("\nError: Invalid first argument '" + argv[0] + "'");
	    showHelp(argsObj, 2);
	    return;
	  }

	  if (fp.includes(argv[0], getValidOptionArgs(argsObj.options))) {
	    // runOption shouldn't make sense semantically, but nor should options doing
	    //   anything without a command.
	    // There are no semantics in CLI land.
	    if (argv.length > 1) {
	      console.warn("\nWarning: Arguments past '" + argv[0] + "' are invalid and were not parsed");
	    }
	    runOption(argv[0], argsObj);
	  } else {
	    // if it's a valid first argument but not help nor version, then it's a command
	    runCommand(argv[0], argsObj);
	  }
	}

	function showHelp(argsObj, std) {
	  var out = std === 1 ? console.log : console.error;

	  // 3 = the number of spaces between the longest command/entry option and their
	  //   corresponding description
	  var padLength = getMaxLength(argsObj) + 3;

	  var commandDescriptions = fp.flow(fp.invokeArgsMap('getDescLine', [padLength]), fp.join('\n'))(argsObj.commands);

	  var description = wrapText('Description: ' + argsObj.description);

	  out('\n' + description + '\n\nUsage: ' + argsObj.entryCommand + ' [options] <command>\n\nOptions\n' + argsObj.options.h.getDescLine(padLength) + '\n' + argsObj.options.v.getDescLine(padLength) + '\n\nCommands\n' + commandDescriptions + '\n\nTo get help for a command, type \'' + argsObj.entryCommand + ' <command> --help\'\n');
	}

	function showVersion(entryCommand) {
	  console.log('\nYou are using ' + entryCommand + ' version: ' + pjson.version + '\n');
	}

	// gets the maximum string length between the command names and entry command
	//   options (help/version)
	function getMaxLength(argsObj) {
	  var commandAliasBarNames = fp.invokeMap('getAliasCommaName', argsObj.commands);

	  return fp.flow(fp.map(function (anOption) {
	    return anOption.getAliasCommaName().length;
	  }), fp.concat(fp.map('length', commandAliasBarNames)), fp.max)(argsObj.options);
	}

	function getEntryCommandOptions(entryCommand, cliArgsObj) {
	  var help = new CommandArg({
	    name: 'help',
	    alias: 'h',
	    type: 'boolean',
	    desc: 'print this',
	    example: 'unused'
	  });
	  var version = new CommandArg({
	    name: 'version',
	    alias: 'v',
	    type: 'boolean',
	    desc: 'print version of ' + entryCommand,
	    example: 'unused'
	  });

	  // these options kind of act like commands.  I'm choosing to keep them as options
	  //   for sake of conforming, so fn is the resulting hack.
	  help.fn = showHelp.bind(null, cliArgsObj, 1);
	  version.fn = showVersion.bind(null, entryCommand);

	  return {
	    h: help,
	    v: version
	  };
	}

	function getCliMarg() {
	  return {
	    schema: {
	      commands: {
	        flags: ['require', 'isLaden'],
	        passEachTo: vCommand
	      },
	      description: ['require', 'isLadenString']
	    },
	    opts: {
	      cb: furtherValidateCreateCli
	    }
	  };
	}

	function furtherValidateCreateCli(argsObj) {
	  var errMsg = void 0;

	  // map all commands since createSafeFn doesn't have this functionality
	  var commands = fp.map(createNew(Command), argsObj.commands);

	  // test for unique arg names
	  var duplicateNames = getDuplicateArgProps('name', commands);
	  if (duplicateNames.length) {
	    var commandsWithDuplicateNames = fp.map(compactProps, getDuplicateArgsMatching('name', duplicateNames, commands));
	    errMsg = "'createCli' requires command names to be unique.\n" + "The following names are duplicate: " + duplicateNames.join(', ') + "\n\n" + "Commands with duplicate names: " + jstring(commandsWithDuplicateNames);

	    throw createError('Invalid Input', errMsg, 'createCli_duplicateNames', {
	      duplicateNames: duplicateNames,
	      commandsWithDuplicateName: commandsWithDuplicateNames
	    });
	  }

	  // test for unique arg aliases
	  var duplicateAliases = getDuplicateArgProps('alias', commands);
	  if (duplicateAliases.length) {
	    var commandsWithDuplicateAliases = fp.map(compactProps, getDuplicateArgsMatching('alias', duplicateAliases, commands));
	    errMsg = "Invalid Input: createCli requires command aliases to be unique.\n" + "The following aliases are duplicate: " + duplicateAliases.join(', ') + "\n\n" + "Commands with duplicate aliases: " + jstring(commandsWithDuplicateAliases);

	    throw createError('Invalid Input', errMsg, 'createCli_duplicateAliases', {
	      duplicateAliases: duplicateAliases,
	      commandsWithDuplicateAliases: commandsWithDuplicateAliases
	    });
	  }
	}

	function getValidFirstArgs(cliArgsObj) {
	  return getValidOptionArgs(cliArgsObj.options).concat(getValidCommands(cliArgsObj.commands));
	}

	function getValidOptionArgs(options) {
	  return fp.concat(fp.map(function (opt) {
	    return '-' + opt.alias;
	  }, options), fp.map(function (opt) {
	    return '--' + opt.name;
	  }, options));
	}

	function getValidCommands(commands) {
	  return fp.flow(fp.filter('alias'), fp.map('alias'), fp.concat(fp.map('name', commands)))(commands);
	}

	function compactProps(val) {
	  if (val.args.length) val = fp.set('args', '[...]', val);
	  // 15 is the number of characters printed as part of
	  //   the error and not included in the description.
	  return fp.set('desc', fp.truncate({ length: VIEW_WIDTH - 15 }, val.desc), val);
	}

	function runOption(opt, cliArgsObj) {
	  var alias = opt.replace(/\-/g, '')[0];
	  cliArgsObj.options[alias].fn();
	}

	function runCommand(cmd, cliArgsObj) {
	  var commands = cliArgsObj.commands;
	  var runName = cmd.replace(/^-+/, '');
	  if (runName.length === 1) {
	    runName = keyToVal('alias', 'name', commands)[runName];
	  }

	  // runName should now be the full name of the command
	  var commandToRun = fp.find({ name: runName }, commands);
	  commandToRun.entryCommand = cliArgsObj.entryCommand;

	  parseCommandArgs(commandToRun);
	}

	//---------//
	// Exports //
	//---------//

	module.exports = {
	  create: safeCreateCli,
	  Command: Command,
	  CommandArg: CommandArg,
	  vCommand: vCommand,
	  vCommandArg: vCommandArg
	};

/***/ },
/* 1 */
/*!********************************!*\
  !*** external "app-root-path" ***!
  \********************************/
/***/ function(module, exports) {

	module.exports = require("app-root-path");

/***/ },
/* 2 */
/*!************************!*\
  !*** ./lib/command.js ***!
  \************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var CommandArg = __webpack_require__(/*! ./command-arg */ 3),
	    common = __webpack_require__(/*! ./common */ 4),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    utils = __webpack_require__(/*! ./utils */ 6);

	//------//
	// Init //
	//------//

	var internalArgs = ['help'],
	    createNew = utils.createNew,
	    isDefined = utils.isDefined,
	    mutableAssign = utils.mutableAssign,
	    mutableAssignAll = utils.mutableAssignAll,
	    wrapText = common.wrapText;

	//------//
	// Main //
	//------//

	function Command(aValidCommand) {
	  var vc = aValidCommand;
	  mutableAssignAll(this, [vc, {
	    name: vc.name || vc.fn.name,
	    args: fp.map(createNew(CommandArg), vc.args)
	  }]);
	}

	mutableAssign(Command.prototype, {
	  getAliasCommaName: function getAliasCommaName() {
	    return this.alias ? this.alias + ', ' + this.name : this.name;
	  },
	  getCompletionDescription: function getCompletionDescription() {
	    return this.completionDesc || fp.truncate({ length: 60 }, this.desc);
	  },
	  getDescLine: function getDescLine(padLength) {
	    // padLength is the padding required between command name and description.
	    //   multiLinePadLength is the padding required for subsequent wrapped lines,
	    //   which ends up being padLength plus the initial two space tab
	    var multiLineLeftIndent = padLength + 2;

	    return '  ' // two space tab
	    + fp.padEnd(padLength, this.getAliasCommaName()) // name + padding
	    + wrapText(this.desc, multiLineLeftIndent); // properly wrapped description
	  },
	  getArgsResult: function getArgsResult() {
	    return fp.flow(fp.filter(function (anArg) {
	      return isDefined(anArg.value) && notInternalArg(anArg);
	    }), fp.reduce(function (res, curArg) {
	      return fp.set(curArg.name, curArg.value, res);
	    }, {}))(this.args);
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

/***/ },
/* 3 */
/*!****************************!*\
  !*** ./lib/command-arg.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var common = __webpack_require__(/*! ./common */ 4),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    utils = __webpack_require__(/*! ./utils */ 6),
	    madonna = __webpack_require__(/*! madonna-fp/es6 */ 8);

	//------//
	// Init //
	//------//

	var isDefined = madonna.FLAG_FNS.isDefined,
	    mutableAssign = utils.mutableAssign,
	    wrapText = common.wrapText;

	//------//
	// Main //
	//------//

	function CommandArg(aSafeCommandArg) {
	  mutableAssign(this, aSafeCommandArg);

	  // all boolean args should default to false
	  if (this.type === 'boolean') this.value = false;

	  // set value if default is defined
	  if (isDefined(this.default)) this.value = this.default;
	}

	mutableAssign(CommandArg.prototype, {
	  getCliAlias: function getCliAlias() {
	    return '-' + this.alias;
	  },
	  getCliName: function getCliName() {
	    return '--' + fp.kebabCase(this.name);
	  },
	  getCompletionDescription: function getCompletionDescription() {
	    return this.completionDesc || fp.truncate({ length: 60 }, this.desc);
	  },
	  isCliAliasOrName: function isCliAliasOrName(cliArg) {
	    return fp.get('length', cliArg) === 2 ? this.getCliAlias() === cliArg : this.getCliName() === cliArg;
	  },
	  isMissing: function isMissing() {
	    return this.isRequired() && fp.isUndefined(this.value);
	  },
	  isRequired: function isRequired() {
	    return fp.includes('require', this.flags);
	  },
	  getAliasCommaName: function getAliasCommaName() {
	    return this.alias ? '-' + this.alias + ', ' + this.getCliName() : '' + this.getCliName();
	  },
	  getDescLine: function getDescLine(padLength, maxTypeStrLength) {
	    // padLength is the padding required between command name and description.
	    //   multiLineLeftIndent is the padding required for subsequent wrapped lines,
	    //   which ends up being padLength plus the initial two space tab
	    var multiLineLeftIndent = padLength + 2;
	    var desc = '{' + this.type + '} ' + fp.repeat(maxTypeStrLength - this.type.length, ' ') + this.desc;
	    return '  ' // two space tab
	    + fp.padEnd(padLength, this.getAliasCommaName()) // name + padding
	    + wrapText(desc, multiLineLeftIndent); // properly wrapped description
	  },
	  setValue: function setValue(val) {
	    this.value = val;return this;
	  }
	});

	//---------//
	// Exports //
	//---------//

	module.exports = CommandArg;

/***/ },
/* 4 */
/*!***********************!*\
  !*** ./lib/common.js ***!
  \***********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	// README
	// - common holds domain-specific functionality.  Utils holds non-domain-specific
	//   functionality.  Both files contain unscoped logic.
	//


	//---------//
	// Imports //
	//---------//

	var fp = __webpack_require__(/*! lodash/fp */ 5),
	    utils = __webpack_require__(/*! ./utils */ 6),
	    wordWrap = __webpack_require__(/*! word-wrap */ 7);

	//------//
	// Init //
	//------//

	var defineProp = utils.defineProp,
	    gt = utils.gt,
	    isDefined = utils.isDefined,
	    mSet = getMutableSet(),
	    VIEW_WIDTH = 80; // chars


	//------//
	// Main //
	//------//

	var createError = function createError(name, msg, id, data) {
	  return fp.flow(mSet('name', name), defineProp('id', { enumerable: true, value: 'map_' + id }), data ? defineProp('data', { enumerable: true, value: data }) : fp.identity)(new Error(msg));
	};

	var getDuplicateArgProps = function getDuplicateArgProps(str, props) {
	  return fp.flow(fp.pickBy(str), fp.countBy(str), fp.pickBy(gt(1)), fp.keys)(props);
	};

	var getDuplicateArgsMatching = function getDuplicateArgsMatching(propKey, dupes, args) {
	  return fp.flow(fp.pickBy(function (anArg) {
	    return fp.includes(anArg[propKey], dupes);
	  }), fp.values)(args);
	};

	function getMutableSet() {
	  return fp.set.convert({ immutable: false });
	}

	var wrapText = function wrapText(str, multiLineLeftIndent) {
	  multiLineLeftIndent = isDefined(multiLineLeftIndent) ? multiLineLeftIndent : 2;

	  var wrapWidth = VIEW_WIDTH - multiLineLeftIndent;
	  var lines = fp.split('\n', wordWrap(str, { width: wrapWidth, indent: '', amendOrphan: true }));
	  var firstLine = lines.shift();

	  return fp.flow(fp.map(fp.flow(fp.concat(fp.repeat(multiLineLeftIndent, ' ')), fp.join(''))), fp.concat(firstLine), fp.join('\n'))(lines);
	};

	//---------//
	// Exports //
	//---------//

	module.exports = {
	  createError: createError,
	  getDuplicateArgProps: getDuplicateArgProps,
	  getDuplicateArgsMatching: getDuplicateArgsMatching,
	  VIEW_WIDTH: VIEW_WIDTH,
	  wrapText: wrapText
	};

/***/ },
/* 5 */
/*!****************************!*\
  !*** external "lodash/fp" ***!
  \****************************/
/***/ function(module, exports) {

	module.exports = require("lodash/fp");

/***/ },
/* 6 */
/*!**********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	// README
	// - common holds domain-specific functionality.  Utils holds non-domain-specific
	//   functionality.  Both files contain unscoped logic.
	//


	//---------//
	// Imports //
	//---------//

	var fp = __webpack_require__(/*! lodash/fp */ 5);

	//------//
	// Main //
	//------//

	//
	// Flipped fp fxns
	//

	var gt = fp.curry(function (b, a) {
	  return fp.gt(a, b);
	});

	//
	// Others
	//

	var defineProp = fp.curry(function (name, desc, obj) {
	  return Object.defineProperty(obj, name, desc);
	});

	var filteredInvokeMap = fp.curry(function (aFilter, invokePath, coll) {
	  return fp.flow(fp.filter(aFilter), fp.invokeMap(invokePath))(coll);
	});

	var filteredMap = fp.curry(function (iteratee, col) {
	  return fp.flow(fp.filter(iteratee), fp.map(iteratee))(col);
	});

	var isDefined = fp.negate(fp.isUndefined);

	function jstring(toStr) {
	  return JSON.stringify(toStr, null, 2);
	}

	var keyToVal = fp.curry(function (keyProp, valProp, arr) {
	  return fp.flow(fp.filter(keyProp), fp.reduce(function (res, cur) {
	    return fp.set(cur[keyProp], cur[valProp], res);
	  }, {}))(arr);
	});

	var mutableAssign = fp.assign.convert({ immutable: false });

	var mutableAssignAll = fp.curry(function (src, objArr) {
	  return fp.reduce(mutableAssign, src, objArr);
	});

	var createNew = fp.curry(function (fn, argsObj) {
	  return new fn(argsObj);
	});

	var mapWithKey = fp.ary(2, fp.map.convert({ cap: false }));

	var prepend = fp.curry(function (str, val) {
	  return str + val;
	});

	function printArgs() {
	  console.log(jstring(arguments));
	}

	function tee(val) {
	  console.dir(val);
	  return val;
	}

	var wrapString = fp.curry(function (left, right, str) {
	  return left + str + right;
	});

	//---------//
	// Exports //
	//---------//

	module.exports = {
	  defineProp: defineProp,
	  filteredInvokeMap: filteredInvokeMap,
	  filteredMap: filteredMap,
	  createNew: createNew,
	  gt: gt,
	  isDefined: isDefined,
	  keyToVal: keyToVal,
	  mapWithKey: mapWithKey,
	  mutableAssign: mutableAssign,
	  mutableAssignAll: mutableAssignAll,
	  prepend: prepend,
	  jstring: jstring,
	  printArgs: printArgs,
	  tee: tee,
	  wrapString: wrapString
	};

/***/ },
/* 7 */
/*!****************************!*\
  !*** external "word-wrap" ***!
  \****************************/
/***/ function(module, exports) {

	module.exports = require("word-wrap");

/***/ },
/* 8 */
/*!*********************************!*\
  !*** external "madonna-fp/es5" ***!
  \*********************************/
/***/ function(module, exports) {

	module.exports = require("madonna-fp/es5");

/***/ },
/* 9 */
/*!***************************************!*\
  !*** external "madonna-function/es5" ***!
  \***************************************/
/***/ function(module, exports) {

	module.exports = require("madonna-function/es5");

/***/ },
/* 10 */
/*!***********************************!*\
  !*** ./lib/parse-command-args.js ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var CommandArg = __webpack_require__(/*! ./command-arg */ 3),
	    common = __webpack_require__(/*! ./common */ 4),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    madonna = __webpack_require__(/*! madonna-fp/es6 */ 8),
	    utils = __webpack_require__(/*! ./utils */ 6);

	//------//
	// Init //
	//------//

	var mapWithKey = utils.mapWithKey,
	    wrapString = utils.wrapString,
	    wrapText = common.wrapText;

	//------//
	// Main //
	//------//

	function parseCommandArgs(aCommand) {
	  var passedArgs = process.argv.slice(3);

	  var helpArg = new CommandArg({
	    name: 'help',
	    alias: 'h',
	    type: 'boolean',
	    desc: 'unused',
	    example: 'unused'
	  });
	  aCommand.args = fp.concat([helpArg], aCommand.args);

	  // handle showHelp first
	  var requiredArgs = fp.filter(fp.invoke('isRequired'), aCommand.args);

	  // just call the function if there aren't any args
	  if (!requiredArgs.length && !passedArgs.length) return aCommand.fn({});

	  if (requiredArgs.length && !passedArgs.length || helpArg.isCliAliasOrName(passedArgs[0])) {
	    var std = passedArgs.length === 0 ? 2 : 1;
	    if (std === 2) {
	      var errMsg = requiredArgs.length === 1 ? 'Error: Please provide the required argument \'' + requiredArgs[0].name + '\'' : "Error: Please provide the required arguments listed below";
	      console.error("\n" + errMsg);
	    }
	    showHelp(aCommand, std);
	    return;
	  }

	  // parseArgs mutates the command args by assigning the passed value to each
	  //   arg (or in the case of flags, assigns true)
	  // Eventually I want to learn facebook's "immutable" library, but for now I
	  //   just want to move forward
	  var argsParsedSuccessfully = parseArgs(aCommand, passedArgs);

	  // if success is falsey, that means it ran into an error and showed the
	  //   help text
	  if (!argsParsedSuccessfully) return;

	  var resultingArgsObj = aCommand.getArgsResult();

	  // if marg was passed,
	  if (aCommand.marg) {
	    var res = madonna.validate(aCommand.marg, resultingArgsObj);
	    if (!res.isValid) {
	      var _ret = function () {
	        // TODO: Prior to this point, we should ensure that the marg schema
	        //   matches arguments declared in the command.  Really only name and
	        //   (non-boolean) require should need checking.  By doing so, it will be
	        //   impossible to get any error besides 'criterionFailed'.  This is
	        //   necessary complexity because I don't want to impose madonna
	        //   onto consumers.
	        var mapFailedCustomCriterion = function mapFailedCustomCriterion(val) {
	          var res = fp.keys(val);
	          if (val.flags) {
	            res = fp.without(res, ['flags']).concat(val.flags);
	          }
	          if (val.custom) {
	            res = fp.without(res, ['custom']).concat(val.custom);
	          }
	          return res;
	        };
	        var failedCriterionDisplay = fp.flow(mapWithKey(function (val, key) {
	          return key + ': ' + mapFailedCustomCriterion(val).join(', ');
	        }), fp.map(wrapText), fp.join('\n'))(res.err.data.failedCriterion);
	        console.error("\nError: The following arguments failed to meet their " + "criterion\n" + failedCriterionDisplay + "\n\n" + "Please refer to the argument descriptions below.");
	        showHelp(aCommand, 2);
	        return {
	          v: void 0
	        };
	      }();

	      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	    }
	  }

	  // otherwise let's run the command function
	  aCommand.fn(resultingArgsObj);
	}

	//-------------//
	// Helper Fxns //
	//-------------//

	function showHelp(aCommand, std) {
	  var out = std === 1 ? console.log : console.error;

	  // 3 = the number of spaces between the longest command/entry option and their
	  //   corresponding description
	  var padLength = getMaxLength(aCommand) + 3,
	      maxTypeStrLength = fp.flow(fp.reject(function (anArg) {
	    return anArg.name === 'help';
	  }), fp.map(fp.get('type.length')), fp.max)(aCommand.args);

	  var requiredAndOptionalArgs = fp.flow(fp.reject({ name: 'help' }), fp.partition(function (anArg) {
	    return fp.includes('require', anArg.flags);
	  }))(aCommand.args);

	  var requiredArgs = requiredAndOptionalArgs[0],
	      optionalArgs = requiredAndOptionalArgs[1];

	  var argDescriptions = '';

	  if (requiredArgs.length) {
	    argDescriptions += '\n\n' + fp.flow(fp.invokeArgsMap('getDescLine', [padLength, maxTypeStrLength]), fp.concat('Required Arguments'), fp.join('\n'))(requiredArgs);
	  }

	  if (optionalArgs.length) {
	    argDescriptions += '\n\n' + fp.flow(fp.invokeArgsMap('getDescLine', [padLength, maxTypeStrLength]), fp.concat('Optional Arguments'), fp.join('\n'))(optionalArgs);
	  }

	  var description = wrapText('Description: ' + aCommand.desc),
	      commandArgsUsage = getCommandArgsUsage(requiredArgs, optionalArgs),
	      usage = wrapText('Usage: ' + aCommand.entryCommand + ' ' + aCommand.name + ' ' + commandArgsUsage);

	  var outStr = '\n' + description + '\n\n' + usage + argDescriptions + '\n';

	  if (out === console.error) {
	    outStr += '\nTo display this help text, type \'' + aCommand.entryCommand + ' ' + aCommand.name + ' --help';
	  }

	  out(outStr);
	}

	// gets the maximum string length between the command names and entry command
	//   options (help/version)
	function getMaxLength(aCommand) {
	  return fp.flow(fp.map(function (anArg) {
	    return anArg.getAliasCommaName().length;
	  }), fp.max)(aCommand.args);
	}

	function getCommandArgsUsage(requiredArgs, optionalArgs) {
	  var requiredCliNameExamplePairs = fp.flow(fp.over([fp.invokeMap('getCliName'), fp.map('example')]), fp.spread(fp.zip))(requiredArgs);

	  var optionalCliNameExamplePairs = fp.flow(fp.map(function (optArg) {
	    var res = [optArg.getCliName()];
	    if (optArg.example) res.push(optArg.example);
	    return res;
	  }), fp.map(function (aPair) {
	    return [wrapString('[', ']', aPair.join(' '))];
	  }))(optionalArgs);

	  return fp.flow(fp.concat(optionalCliNameExamplePairs), fp.map(fp.join(' ')), fp.join('  '))(requiredCliNameExamplePairs);
	}

	function parseArgs(aCommand, passedArgs) {
	  var getCurArg = createGetCurArg(aCommand);
	  var curArg = void 0,
	      curPassedArg = void 0,
	      val = void 0; // val is only used in case 'number';

	  while (passedArgs.length) {
	    // eslint throws a fit when I place this assignment inside the while
	    curPassedArg = passedArgs.shift();
	    curArg = getCurArg(curPassedArg);
	    if (!curArg) break;

	    switch (curArg.type) {
	      case 'string':
	        if (!passedArgs.length) {
	          console.error("\nError: Argument '" + curPassedArg + "' requires a string argument to be passed");
	          showHelp(aCommand, 2);
	          return;
	        }
	        curArg.setValue(passedArgs.shift());
	        break;

	      case 'number':
	        if (!passedArgs.length) {
	          console.error("\nError: Argument '" + curPassedArg + "' requires a number argument to be passed");
	          showHelp(aCommand, 2);
	          return;
	        }
	        val = passedArgs.shift();
	        if (isNaN(fp.toNumber(val))) {
	          console.error("\nError: Argument must be passed a valid number.\n" + "Argument: " + curPassedArg + "\n" + "Value: " + val);
	          showHelp(aCommand, 2);
	          return;
	        }
	        curArg.setValue(fp.toNumber(val));
	        break;

	      case 'boolean':
	        curArg.setValue(true);
	        break;
	    }
	  }

	  if (passedArgs.length && !curArg) {
	    console.error("\nError: Stopped parsing due to the invalid argument '" + curPassedArg + "'");
	    showHelp(aCommand, 2);
	    return false;
	  }

	  var missingArgs = getMissingArguments(aCommand.args);
	  if (missingArgs.length) {
	    console.error("\nError: Not all required arguments were passed\n" + "Missing arguments: " + missingArgs.join(' '));
	    showHelp(aCommand, 2);
	    return false;
	  }

	  return true;
	}

	function getMissingArguments(args) {
	  return fp.flow(fp.pickBy(fp.invoke('isMissing')), fp.invokeMap('getCliName'))(args);
	}

	function createGetCurArg(aCommand) {
	  return function (curPassedArg) {
	    return fp.find(fp.invokeArgs('isCliAliasOrName', [curPassedArg]), aCommand.args);
	  };
	}

	//---------//
	// Exports //
	//---------//

	module.exports = parseCommandArgs;

/***/ },
/* 11 */
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 12 */
/*!**************************!*\
  !*** ./lib/v-command.js ***!
  \**************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var common = __webpack_require__(/*! ./common */ 4),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    madonna = __webpack_require__(/*! madonna-fp/es6 */ 8),
	    utils = __webpack_require__(/*! ./utils */ 6),
	    vCommandArg = __webpack_require__(/*! ./v-command-arg */ 13);

	//------//
	// Init //
	//------//

	var createError = common.createError,
	    getDuplicateArgProps = common.getDuplicateArgProps,
	    getDuplicateArgsMatching = common.getDuplicateArgsMatching,
	    jstring = utils.jstring,
	    gt = madonna.CRITERION_FNS.gt,
	    nameRegex = /^[a-zA-Z][a-zA-Z0-9_]+$/;

	var safeCommandMarg = getSafeCommandMarg();

	//------//
	// Main //
	//------//

	var vCommand = madonna.createValidator(safeCommandMarg);

	//-------------//
	// Helper Fxns //
	//-------------//

	function furtherValidateCommand(argsObj) {
	  var errMsg = void 0;

	  // ensure we have a command name
	  if (!argsObj.name && (!argsObj.fn.name || !nameRegex.test(argsObj.fn.name))) {
	    errMsg = "Invalid Input: Command requires either name to be defined " + "or for the\nfunction name to pass the following regex: " + nameRegex.toString() + "\n\n" + "The function name that was passed: " + (argsObj.fn.name || "''") + "\n";

	    throw createError('Invalid Input', errMsg, 'vCommand_mustHaveValidName', {
	      fnName: argsObj.fn.name
	    });
	  }

	  // ensure unique arg names
	  var duplicateNames = getDuplicateArgProps('name', argsObj.args);
	  if (duplicateNames.length) {
	    var argsWithDuplicateNames = getDuplicateArgsMatching('name', duplicateNames, argsObj.args);
	    errMsg = "Command requires argument names to be unique.\n" + "The following names are duplicate: " + duplicateNames.join(', ') + "\n\n" + "Args with duplicate names: " + jstring(argsWithDuplicateNames);

	    throw createError('Invalid Input', errMsg, 'vCommand_duplicateArgNames', {
	      duplicateArgNames: duplicateNames,
	      argsWithDuplicateNames: argsWithDuplicateNames
	    });
	  }

	  // ensure unique arg aliases
	  var duplicateAliases = getDuplicateArgProps('alias', argsObj.args);
	  if (duplicateAliases.length) {
	    var argsWithDuplicateAliases = getDuplicateArgsMatching('alias', duplicateAliases, argsObj.args);
	    errMsg = "Command requires argument aliases to be unique.\n" + "The following aliases are duplicate: " + duplicateAliases.join(', ') + "\n\n" + "Args with duplicate aliases: " + jstring(argsWithDuplicateAliases);

	    throw createError('Invalid Input', errMsg, 'vCommand_duplicateArgAliases', { duplicateAliases: duplicateAliases, argsWithDuplicateAliases: argsWithDuplicateAliases });
	  }

	  return { isValid: true };
	}

	function getSafeCommandMarg() {
	  return {
	    schema: {
	      alias: ['isCharacter'],
	      args: {
	        flags: ['isLaden'],
	        passEachTo: vCommandArg
	      },
	      completionDesc: ['isLadenString'],
	      desc: ['require', 'isLadenString'],
	      fn: ['require', 'isFunction'],
	      marg: ['isLadenPlainObject'],
	      name: {
	        flags: ['require', 'isString'],
	        custom: {
	          hasSizeGt1: fp.flow(fp.size, gt(1))
	        }
	      }
	    },
	    opts: {
	      name: 'vCommand',
	      cb: furtherValidateCommand
	    }
	  };
	}

	//---------//
	// Exports //
	//---------//

	module.exports = vCommand;

/***/ },
/* 13 */
/*!******************************!*\
  !*** ./lib/v-command-arg.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//---------//
	// Imports //
	//---------//

	var common = __webpack_require__(/*! ./common */ 4),
	    fp = __webpack_require__(/*! lodash/fp */ 5),
	    madonna = __webpack_require__(/*! madonna-fp/es6 */ 8),
	    utils = __webpack_require__(/*! ./utils */ 6);

	//------//
	// Init //
	//------//

	var createError = common.createError,
	    isDefined = utils.isDefined,
	    jstring = utils.jstring;

	var safeArgMarg = getSafeArgMarg();

	//------//
	// Main //
	//------//

	var vCommandArg = madonna.createValidator(safeArgMarg);

	//-------------//
	// Helper Fxns //
	//-------------//

	function getSafeArgMarg() {
	  return {
	    schema: {
	      alias: {
	        flags: ['isCharacter'],
	        matchesRegex: /^[^\s\-]$/
	      },
	      argCompletionText: ['isLadenString'],
	      completionDesc: ['isLadenString'],
	      default: ['isDefined'],
	      desc: ['require', 'isLadenString'],
	      example: ['isLadenString'],
	      flags: {
	        flags: ['isLadenArray'],
	        allContainedIn: ['require'] // this will likely grow to more than a single element
	      },
	      name: {
	        flags: ['require', 'isString'],
	        matchesRegex: /^[^\s\-][^\s]+$/
	      },
	      type: {
	        flags: ['require'],
	        containedIn: ['boolean', 'string', 'number']
	      }
	    },
	    opts: {
	      cb: furtherValidateArg,
	      name: 'vCommandArg'
	    }
	  };
	}

	function furtherValidateArg(argsObj) {

	  // ensure require and default aren't both declared
	  if (fp.includes('require', argsObj.flags) && argsObj.default) {
	    throw createError('Invalid Input', "Since the 'default' option implies an optional parameter," + " it is not allowed alongside the 'require' flag\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_requireWithDefault', {
	      argsObj: argsObj
	    });
	  }

	  // ensure require isn't declared on a boolean arg
	  if (fp.includes('require', argsObj.flags) && argsObj.type === 'boolean') {
	    throw createError('Invalid Input', "The 'require' flag doesn't apply to boolean arguments.  The presence of" + " a boolean argument indicates the value 'true', thus if it were required the value would always be true\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_requireWithBoolean', {
	      argsObj: argsObj
	    });
	  }

	  // ensure default isn't declared on a boolean arg
	  if (isDefined(argsObj.default) && argsObj.type === 'boolean') {
	    throw createError('Invalid Input', "Default values don't apply to boolean arguments since their presence" + " should always indicate the value 'true'\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_defaultWithBoolean', {
	      argsObj: argsObj
	    });
	  }

	  // ensure example IS NOT declared on a BOOLEAN arg
	  if (isDefined(argsObj.example) && argsObj.type === 'boolean') {
	    throw createError('Invalid Input', "Examples don't apply to boolean arguments since examples are used to " + "generate the usage string.  It wouldn't make sense to have an " + "example in place of the flag.\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_exampleWithBoolean', {
	      argsObj: argsObj
	    });
	  }

	  // ensure example IS declared on a NON-BOOLEAN arg
	  if (fp.isUndefined(argsObj.example) && argsObj.type !== 'boolean') {
	    throw createError('Invalid Input', "Examples must be provided to non-boolean arguments.  The usage string " + "depends on them\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_exampleRequiredForNonBooleans', {
	      argsObj: argsObj
	    });
	  }

	  // ensure argCompletionText is not declared on a boolean arg
	  if (argsObj.type === 'boolean' && argsObj.argCompletionText) {
	    throw createError('Invalid Input', "argCompletionText can't apply to booleans since booleans are never" + "passed a value\n" + "argsObj: " + jstring(argsObj), 'vCommandArg_argCompletionTextWithBoolean', {
	      argsObj: argsObj
	    });
	  }

	  return { isValid: true };
	}

	//---------//
	// Exports //
	//---------//

	module.exports = vCommandArg;

/***/ }
/******/ ]);