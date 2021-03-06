#!/usr/bin/env node

const parser = require('../lib/parser').default;

require('yargs')
	.scriptName('react-tsdoc')
	.usage('$0 [args]')
	.command('$0 <path> [output]', 'Run the docgen', (yargs) => {
		return yargs.positional('path', {
			describe: 'file or files to parse',
			type: 'string'
		});
	}, function (argv) {
		parser(argv.path, argv.output, true);
	})
	.option('output', {
		alias: 'o',
		type: 'string',
		description: 'The file to write to'
	})
	.help()
	.demandCommand(1)
	.parse();
