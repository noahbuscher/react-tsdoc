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
	BindingElement,
	ts
} from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';

const project = new Project();

// Hardcoded for now
project.addSourceFilesAtPaths('tests/**/*{.ts,.tsx}');

project.resolveSourceFileDependencies();

const sourceFiles = project.getSourceFiles()

const doc: any = {}

const PARAM_DEFAULT = {
	description: '',
	required: false,
	tsType: {
		name: 'unknown'
	}
};

/**
 * Get all the TS params for a given node
 *
 * @param node - The current AST node
 */
const getParams = (node: ArrowFunction|FunctionDeclaration) => {
	const params = [];

	// Placeholder for the (eventually) resolved TypeLiteral
	let nodeTypeParams: Node;

	// Grab the params node
	const nodeParams = node.getParameters()[0];

	// Grab the properties from the params node
	const nodeProperties = nodeParams.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);

	// Grab the TS params from the params node
	nodeTypeParams = nodeParams.getLastChildByKind(SyntaxKind.TypeLiteral);

	// Type literal exists, but doesn't contain any params; return
	if (nodeTypeParams && nodeTypeParams.getChildCount() === 0) return [];

	// Not a literal, likely a ref
	if (!nodeTypeParams) {

		// The reference identifier for the type (defined elsewhere)
		const typeRef = nodeParams.getFirstChildByKind(SyntaxKind.TypeReference);

		// Grab ref's identifier
		const typeRefIdentifier = typeRef.getFirstChildByKind(SyntaxKind.Identifier);

		// First index is the root definition node
		nodeTypeParams = typeRefIdentifier.getDefinitionNodes()[0];
	}

	// For each type param (source of truth)
	nodeTypeParams.forEachChild((childNode: PropertySignature) => {
		const paramIdentifier = childNode.getFirstChildByKind(SyntaxKind.Identifier);
		if (!paramIdentifier) return;

		const paramName = paramIdentifier.getText();

		// Seek out complimentary initializer, if any
		const initializer = nodeProperties.forEachChild((child: BindingElement) => {
			if (paramName === child.getFirstChildByKind(SyntaxKind.Identifier).getText()) {
				return child.getInitializer()?.getText();
			}
		})

		// Pass as much as we know about params to avoid successive searches
		params[paramName] = {
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
const renderParamBlock = (node: any) => {
	if (node instanceof tsdoc.DocPlainText) {
		return node.text;
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
 * Walk the AST and find React components
 *
 * @param node - The current AST node
 */
const generateDocs = (sourceFiles: SourceFile[]) => {
	const sourceFileCount = project.getSourceFiles().length;
	project.getSourceFiles().forEach((sourceFile, sourceFileIndex) => {
		const sourceFilePath = path.relative(process.cwd(), sourceFile.getFilePath().toString());

		const declarations = [
			...sourceFile.getVariableDeclarations(),
			...sourceFile.getFunctions()
		];

		declarations.forEach((node) => {
			const name = node.getName()
			const isComponent = name[0] === name[0].toUpperCase()

			if (isComponent) {
				// @ts-ignore
				const component = node.getKind() === SyntaxKind.FunctionDeclaration
					? node
					: node.getFirstChildByKind(SyntaxKind.ArrowFunction);

				// @ts-ignore
				const params = getParams(component);

				doc[sourceFilePath] = {
					description: '',
					props: {}
				};

				for (const param in params) {
					const { required, initializer } = params[param];

					doc[sourceFilePath].props[param] = {
						...PARAM_DEFAULT,
						required,
						defaultValue: initializer && {
							value: initializer,
							computed: false
						}
					};
				};

				// Add descriptions for documented params
				const commentRanges = findCommentRanges(
					component.getKind() === SyntaxKind.FunctionDeclaration
						? component
						: component.getFirstAncestorByKind(SyntaxKind.VariableStatement)
				);

				commentRanges.map((range) => {
					const comment: tsdoc.DocComment = parseTSDoc(range);

					doc[sourceFilePath].description = renderCommentSummary(comment);

					comment.params.blocks.forEach((paramBlock: tsdoc.DocParamBlock) => {

						// Don't document params that aren't omitted from TS
						if (doc[sourceFilePath].props[paramBlock.parameterName]) {
							doc[sourceFilePath].props[paramBlock.parameterName] = {
								...doc[sourceFilePath].props[paramBlock.parameterName],
								description: renderParamBlock(paramBlock.content)
							}
						}
					});
				});
			} else {
				// Not a React component
				return;
			}
		});

		console.log(`Finished processing file ${sourceFileIndex + 1} of ${sourceFileCount}`);
	});

	fs.writeFile('output.json', JSON.stringify(doc), 'utf8', () => {
		console.log('Finished documentation generation!');
	});
}

const program = project.getProgram();

// @ts-ignore
let diagnostics = program.getSyntacticDiagnostics();

if (diagnostics.length) {
	diagnostics.forEach((diagnostic) => {
		console.error(`${diagnostic.getMessageText()} on line ${diagnostic.getLineNumber()} in ${diagnostic.getSourceFile().getFilePath()}`);
	});
} else {
	generateDocs(sourceFiles)
}
