import path from 'path';
import fs from 'fs';
import {
	Project,
	SyntaxKind,
	Node,
	ArrowFunction,
	FunctionDeclaration,
	PropertySignature,
	SourceFile,
	TypeLiteralNode,
	TypeReferenceNode,
	VariableDeclaration,
	ExportDeclaration,
	InterfaceDeclaration
} from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';

const project = new Project();

const doc: any = {};

/**
 * Checks if a given declaration is a React component
 *
 * @param node - The node to check
 */
const isReactComponent = (node: ExportDeclaration) => {
	if (node.getKind() === SyntaxKind.VariableDeclaration
	|| node.getKind() == SyntaxKind.FunctionDeclaration) {
		// @ts-ignore
		const name = node.getName();
		if (!name) throw Error;

		return name[0] === name[0].toUpperCase();
	}

	return false;
}

/**
 * Get all the TS params for a given node
 *
 * @param node - The current AST node
 */
const getParams = (node: ArrowFunction|FunctionDeclaration) => {
	const params: [] = [];

	// Placeholder for the (eventually) resolved TypeLiteral
	let nodeTypeParams: Node|TypeLiteralNode|TypeReferenceNode|undefined;

	// Grab the params node
	const nodeParams = node.getParameters()[0];

	// Grab the properties from the params node
	const nodeProperties = nodeParams.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);

	if (!nodeProperties) throw Error;

	// Grab the TS params from the params node
	nodeTypeParams = nodeParams.getLastChildByKind(SyntaxKind.TypeLiteral);

	// Type literal exists, but doesn't contain any params; return
	if (nodeTypeParams && nodeTypeParams.getChildCount() === 0) return [];

	// Not a literal, likely a ref
	if (!nodeTypeParams) {

		// The reference identifier for the type (defined elsewhere)
		const typeRef = nodeParams.getFirstChildByKind(SyntaxKind.TypeReference);

		// No type ref either... get outta here
		if (!typeRef) throw Error;

		// Grab ref's identifier
		const typeRefIdentifier = typeRef.getFirstChildByKind(SyntaxKind.Identifier);

		if (!typeRefIdentifier) throw Error;

		// First index is the root definition node
		nodeTypeParams = typeRefIdentifier.getDefinitionNodes()[0];
	}

	// For each type param (source of truth)
	nodeTypeParams.forEachChild((childNode: Node|PropertySignature) => {
		const paramIdentifier = childNode.getFirstChildByKind(SyntaxKind.Identifier);
		if (!paramIdentifier) return;

		const paramName: string = paramIdentifier.getText() || '';

		// Seek out complimentary initializer, if any
		const initializer = nodeProperties.forEachChild((child: any) => {
			if (child.getKind() === SyntaxKind.BindingElement
				&& paramName === child.getFirstChildByKind(SyntaxKind.Identifier)?.getText()
			) {
				return child.getInitializer()?.getText();
			}
		})

		// Pass as much as we know about params to avoid successive searches
		params[paramName] = {
			// @ts-ignore
			required: !childNode.getQuestionTokenNode(),
			initializer
		}
	});

	return params;
}

/**
 * Find comment ranges for the React AST node
 *
 * @param node - The current AST node
 */
const findCommentRanges = (node: Node) => {
	const commentRanges = node.getLeadingCommentRanges();

	if (commentRanges?.length) {
		const commentStrings = commentRanges.map((range) =>
			tsdoc.TextRange.fromStringRange(node.getSourceFile().getFullText(), range.getPos(), range.getEnd())
		);

		return commentStrings;
	}

	return [];
}

/**
 * Parses the comment from the range
 *
 * @param comment - The object containing the comment range
 */
const parseTSDoc = (comment: any) => {
	const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser();
	const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(comment);
	const docComment: tsdoc.DocComment = parserContext.docComment;

	if (parserContext.log.messages.length === 0) {
		// console.log('No TSDoc errors or warnings.');
	} else {
		for (const message of parserContext.log.messages) {
			console.log('Errors parsing TSDoc: ', message);
		}
	}

	return docComment;
}

/**
 * Gets the TSDoc node's content (no API support yet)
 *
 * @param node - The current AST node
 */
// @ts-ignore
const renderParamBlock = (node: any) => {
	if (node instanceof tsdoc.DocPlainText) {
		return node.text;
	} else {

	}

	for (const childNode of node.getChildNodes()) {
		return renderParamBlock(childNode);
	}
}

/**
 * Returns the text of the summary for a given comment block
 *
 * @param comment - The comment to render
 */
const renderCommentSummary = (comment: tsdoc.DocComment) => {
	return comment.summarySection
		.getChildNodes()[0] // Grabs the summary nodes
		// @ts-ignore
		.getChildNodes()[0].text // Grabs text of the Paragraph node
}

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

			const component = node.getKind() === SyntaxKind.FunctionDeclaration
				? node
				: node.getFirstChildByKind(SyntaxKind.ArrowFunction);

			// @ts-ignore
			const params = getParams(component);

			doc = {
				description: '',
				props: {}
			};

			for (const param in params) {
				const { required, initializer } = params[param];

				doc.props[param] = {
					required,
					defaultValue: initializer && {
						value: initializer,
						computed: false
					},
					tsType: {
						name: 'unknown'
					}
				};
			};

			// Add descriptions for documented params
			const commentRanges = findCommentRanges(
				// @ts-ignore
				component.getKind() === SyntaxKind.FunctionDeclaration
					? component
					// Comment ranges are not on the ArrowFunction
					: component?.getFirstAncestorByKind(SyntaxKind.VariableStatement)
			);

			commentRanges.map((range) => {
				const comment: tsdoc.DocComment = parseTSDoc(range);

				doc.description = renderCommentSummary(comment);

				comment.params.blocks.forEach((paramBlock: tsdoc.DocParamBlock) => {

					// Don't document params that aren't omitted from TS
					if (doc.props[paramBlock.parameterName]) {
						doc.props[paramBlock.parameterName] = {
							...doc.props[paramBlock.parameterName],
							description: renderParamBlock(paramBlock.content)
						}
					}
				});
			});
		});
	})

	return doc || false;
}

/**
 * Walk the AST and find React components
 *
 * @param node - The current AST node
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
 * Parses file(s) and generates JSON docs
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
			console.error(`${diagnostic.getMessageText()} on line ${diagnostic.getLineNumber()} in ${diagnostic.getSourceFile().getFilePath()}`);
		});
		return;
	}

	if (isCLI) {
		console.time('Finished in');
	}

	const docs = generateDocs(project.getSourceFiles(), output, isCLI);

	if (isCLI) {
		console.timeEnd('Finished in');
		fs.writeFile(output, JSON.stringify(docs), 'utf8', ()=>{});
	} else {
		return docs;
	}
}

export default parser;
