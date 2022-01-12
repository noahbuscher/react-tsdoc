import path from 'path';
import fs from 'fs';
import {
	Project,
	SourceFile,
	ExportedDeclarations
} from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';
import { isReactComponent, getComponentFunction } from './utils/reactComponentHelper';
import { getDeclarationParams } from './utils/paramsHelper';
import {
	getDeclarationDescription,
	getPropBlocks,
	renderPropBlock
} from './utils/tsDocHelper';
import { getDefaultExport } from './utils/exportHelper';

const project = new Project();

/**
 * Generate docs for a singular file
 *
 * @param sourceFile - The sourceFile node to document
 */
export const generateDocsForFile = (sourceFile: SourceFile): reactTSDoc.Doc|undefined => {
	const defaultExport = getDefaultExport(sourceFile);

	if (!defaultExport || !isReactComponent(defaultExport)) return;

	const component = getComponentFunction(defaultExport);

	if (component) {
		const doc: any = {
			props: {}
		};

		const params = getDeclarationParams(component);

		for (const param in params) {
			const { required, initializer, type } = params[param];

			doc.props[param] = {
				...(!!initializer) && {defaultValue: {
					value: initializer,
					computed: false
				}},
				required,
				tsType: type
			};
		};

		doc.description = getDeclarationDescription(component);

		getPropBlocks(component).forEach((propBlock: tsdoc.DocBlock) => {
			const parsedPropBlock = renderPropBlock(propBlock.content);

			if (!parsedPropBlock) return;

			if (doc.props[parsedPropBlock.propName]) {
				doc.props[parsedPropBlock.propName] = {
					description: parsedPropBlock.content,
					...doc.props[parsedPropBlock.propName]
				}
			}
		});

		return doc;
	}

	return undefined;
}

/**
 * Parses file(s) and generates JSON docs
 *
 * @param sourceFiles - File(s) to parse
 * @param output - File to write results to (if CLI)
 * @param isCLI - Sets if function should log to console
 */
const generateDocs = (sourceFiles: SourceFile[], isCLI: boolean = false): {[name: string]: reactTSDoc.Doc} => {
	const sourceFileCount = project.getSourceFiles().length;
	const docs = {};

	sourceFiles.forEach((sourceFile, sourceFileIndex) => {
		if (isCLI) {
			console.log(`Processing file ${sourceFileIndex + 1} of ${sourceFileCount}`);
		}

		const sourceFilePath = path.relative(process.cwd(), sourceFile.getFilePath().toString());

		const fileDocs = generateDocsForFile(sourceFile);

		if (fileDocs) {
			docs[sourceFilePath] = fileDocs;
		}
	});

	return docs;
}

/**
 * Load up files, check for syntax errors, and return/write data
 *
 * @param directory - File(s) to parse
 * @param output - File to write results to (if CLI)
 * @param isCLI - Sets if function should log to console
 */
const parser = (directory: string, output: string, isCLI: boolean = false) => {
	const program = project.getProgram();

	if (fs.lstatSync(directory).isDirectory()) {
		project.addSourceFilesAtPaths(`${directory}/**/*{.ts,.tsx}`);
	} else if (fs.lstatSync(directory).isFile()) {
		project.addSourceFileAtPath(directory);
	}

	project.resolveSourceFileDependencies();

	let diagnostics = program.getSyntacticDiagnostics();

	if (diagnostics.length) {
		diagnostics.forEach((diagnostic) => {
			throw Error(`${diagnostic.getMessageText()} on line ${diagnostic.getLineNumber()} in ${diagnostic.getSourceFile().getFilePath()}`);
		});
		return;
	}

	if (isCLI) console.time('Finished in');

	const docs = generateDocs(project.getSourceFiles(), isCLI);

	if (isCLI) {
		fs.writeFile(output, JSON.stringify(docs), 'utf8', ()=>{
			console.timeEnd('Finished in');
		});
	} else {
		return docs;
	}
}

export default parser;
