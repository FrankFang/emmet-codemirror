let EmmetEditor = require('./editor')
let emmet = require ('./emmet')

function noop() {
	if (CodeMirror.version >= '3.1') {
		return CodeMirror.Pass;
	}
	
	throw CodeMirror.Pass;
}

/**
 * Emmet action decorator: creates a command function
 * for CodeMirror and executes Emmet action as single
 * undo command
 * @param  {String} name Action name
 * @return {Function}
 */
function actionDecorator(name) {
	return function(cm) {
		let result;
		cm.operation(() => result = runAction(name, new EmmetEditor(cm)));
		return result;
	};
}

/**
 * Same as `actionDecorator()` but executes action
 * with multiple selections
 * @param  {String} name Action name
 * @return {Function}
 */
function multiSelectionActionDecorator(name) {
	return function(cm) {
		let editor = new EmmetEditor(cm);
		let selections = editor.selectionList();
		let result = null;
		cm.operation(function() {
			for (let i = 0, il = selections.length; i < il; i++) {
				editor.selectionIndex = i;
				result = runAction(name, editor);
				if (result === CodeMirror.Pass) {
					break;
				}
			}
		});
		return result;
	};
}

/**
 * Runs Emmet action
 * @param  {String}      name Action name
 * @param  {EmmetEditor} editor EmmetEditor instance
 * @return {Boolean}    Returns `true` if action is performed
 * successfully
 */
function runAction(name, editor) {
	if (name == 'expand_abbreviation_with_tab' && (editor.context.somethingSelected() || !editor.isValidSyntax())) {
		// pass through Tab key handler if there's a selection
		return noop();
	}
	
	let result = false;
	try {
		result = emmet.run(name, editor);
		if (!result && name == 'insert_formatted_line_break_only') {
			return noop();
		}
	} catch (e) {
		console.error(e);
	}

	return result;
}

let systemKeymap = function(keymap) {
	let mac = /Mac/.test(navigator.platform);
	let out = {};
	Object.keys(keymap).forEach(key => out[!mac ? key.replace('Cmd', 'Ctrl') : key] = keymap[key]);
	return out;
}
/**
 * Emmet plugin for CodeMirror
 */

let defaultKeymap = {
	'Cmd-E': 'emmet.expand_abbreviation',
	'Tab': 'emmet.expand_abbreviation_with_tab',
	'Cmd-D': 'emmet.balance_outward',
	'Shift-Cmd-D': 'emmet.balance_inward',
	'Cmd-M': 'emmet.matching_pair',
	'Shift-Cmd-A': 'emmet.wrap_with_abbreviation',
	'Ctrl-Alt-Right': 'emmet.next_edit_point',
	'Ctrl-Alt-Left': 'emmet.prev_edit_point',
	'Cmd-L': 'emmet.select_line',
	'Cmd-Shift-M': 'emmet.merge_lines',
	'Cmd-/': 'emmet.toggle_comment',
	'Cmd-J': 'emmet.split_join_tag',
	'Cmd-K': 'emmet.remove_tag',
	'Shift-Cmd-Y': 'emmet.evaluate_math_expression',

	'Ctrl-Up': 'emmet.increment_number_by_1',
	'Ctrl-Down': 'emmet.decrement_number_by_1',
	'Ctrl-Alt-Up': 'emmet.increment_number_by_01',
	'Ctrl-Alt-Down': 'emmet.decrement_number_by_01',
	'Shift-Ctrl-Up': 'emmet.increment_number_by_10',
	'Shift-Ctrl-Down': 'emmet.decrement_number_by_10',

	'Shift-Cmd-.': 'emmet.select_next_item',
	'Shift-Cmd-,': 'emmet.select_previous_item',
	'Cmd-B': 'emmet.reflect_css_value',
	
	'Enter': 'emmet.insert_formatted_line_break_only'
};

// actions that should be performed in single selection mode
let singleSelectionActions = [
	'prev_edit_point', 'next_edit_point', 'merge_lines',
	'reflect_css_value', 'select_next_item', 'select_previous_item',
	'wrap_with_abbreviation', 'update_tag', 'insert_formatted_line_break_only'
];

/**
 * Setup Emmet on given CodeMirror editor instance
 * @param  {CodeMirror} cm
 * @param  {Object} keymap
 */
let main = function(cm, keymap) {
  keymap = keymap || defaultKeymap
	keymap = systemKeymap(keymap);
	cm.__emmetKeymap = keymap;
	cm.addKeyMap(keymap);
  debugger
	return cm;
}

module.exports = main

main.dispose = function(cm) {
	if (cm.__emmetKeymap) {
		cm.removeKeyMap(cm.__emmetKeymap);
		delete cm.__emmetKeymap;
	}
};

xxx.defaultKeymap = defaultKeymap;
xxx.systemKeymap = systemKeymap;
xxx.emmet = emmet;
xxx.EmmetEditor = EmmetEditor;
xxx.setup = function(CodeMirror) {
	// setup default Emmet actions
	emmet.actions.getList().forEach(obj => {
		let action = obj.name;
		let command = 'emmet.' + action;

		if (!CodeMirror.commands[command]) {
			CodeMirror.commands[command] = ~singleSelectionActions.indexOf(action)
				? actionDecorator(action)
				: multiSelectionActionDecorator(action);
		}
	});

	// add “profile” property to CodeMirror defaults so in won’t be lost
	// then CM instance is instantiated with “profile” property
	if (CodeMirror.defineOption) {
		CodeMirror.defineOption('profile', 'html');
	} else {
		CodeMirror.defaults.profile = 'html';
	}
};

if (typeof CodeMirror !== 'undefined') {
	xxx.setup(CodeMirror);
}

