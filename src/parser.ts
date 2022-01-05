import path from 'path';
import fs from 'fs';
import {
	Project,
	SourceFile,
	ExportDeclaration
} from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';
import { isReactComponent, getComponentFunction } from './utils/reactComponentHelper';
import { getDeclarationParams } from './utils/paramsHelper';
import {
	getDeclarationDescription,
	getParamComments,
	renderParamBlock
} from './utils/tsDocHelper';

const project = new Project();

/**
 * Generate docs for a singular file
 *
 * @param sourceFile - The sourceFile node to document
 */
const generateDocsForFile = (sourceFile: SourceFile) => {
	let doc: any;

	const exportedDeclarations = sourceFile.getExportedDeclarations();

	// @ts-ignore
	exportedDeclarations.forEach((declarations: ExportDeclaration[]) => {
		declarations.forEach((node: ExportDeclaration) => {
			if (!isReactComponent(node)) return;

			// We only allow one exported component definition per file
			if (doc) {
				throw Error(
					`Multiple exported component definitions found in ${sourceFile.getFilePath()}`
				);
			}

			const component = getComponentFunction(node);

			// @ts-ignore
			const params = getDeclarationParams(component);

			doc = {
				description: '',
				props: {}
			};

			for (const param in params) {
				const { required, initializer, type } = params[param];

				doc.props[param] = {
					required,
					defaultValue: initializer && {
						value: initializer,
						computed: false
					},
					tsType: type
				};
			};

			// @ts-ignore
			doc.description = getDeclarationDescription(component);

			// @ts-ignore
			getParamComments(component).forEach((paramBlock: tsdoc.DocParamBlock) => {

				// Don't document params that aren't omitted from TS
				if (doc.props[paramBlock.parameterName]) {
					doc.props[paramBlock.parameterName] = {
						...doc.props[paramBlock.parameterName],
						description: renderParamBlock(paramBlock.content)
					}
				}
			});
		});
	})

	return doc || false;
}

/**
 * Parses file(s) and generates JSON docs
 *
 * @param sourceFiles - File(s) to parse
 * @param output - File to write results to (if CLI)
 * @param isCLI - Sets if function should log to console
 */
const generateDocs = (sourceFiles: SourceFile[], output: string, isCLI: boolean = false) => {
	const sourceFileCount = project.getSourceFiles().length;
	const docs = {};

	project.getSourceFiles().forEach((sourceFile, sourceFileIndex) => {
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

	// @ts-ignore
	let diagnostics = program.getSyntacticDiagnostics();

	if (diagnostics.length) {
		diagnostics.forEach((diagnostic) => {
			throw Error(`${diagnostic.getMessageText()} on line ${diagnostic.getLineNumber()} in ${diagnostic.getSourceFile().getFilePath()}`);
		});
		return;
	}

	if (isCLI) console.time('Finished in');

	const docs = generateDocs(project.getSourceFiles(), output, isCLI);

	if (isCLI) {
		fs.writeFile(output, JSON.stringify(docs), 'utf8', ()=>{
			console.timeEnd('Finished in');
		});
	} else {
		return docs;
	}
}

export default parser;
