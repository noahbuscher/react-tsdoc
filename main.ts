import ts from 'typescript';
import * as tsdoc from '@microsoft/tsdoc';

// Hardcoded path for now
const filePath = './tests/test.tsx';

const doc: any = {
	description: '',
	props: {}
};

const PARAM_DEFAULT = {
	description: '',
	required: false,
	tsType: {
		name: 'unknown'
	}
};

const program = ts.createProgram([filePath], {});

// No idea why we have to include this, but breaks if omitted (???)
const checker = program.getTypeChecker();

const source = program.getSourceFile(filePath);

/**
 * Determine if the current node is (or returns) a JSX Element
 * OR is something like React.component
 *
 * @param node - The current AST node
 */
const isReactComponent = (node: ts.Node) => {
	if (ts.isJsxElement(node)
		|| ts.isJsxFragment(node)
	) {
		return true;
	}

	return false;
}

/**
 * Walk the AST in reverse to find the parent
 *
 * @param node - The current AST node
 */
const findJSXParentComponent = (node: ts.Node) => {
	if (ts.isVariableStatement(node)) {
		return node;
	}

	return findJSXParentComponent(node.parent);
}

/**
 * Resolve a type ref by name to a node
 *
 * @param refName - The type ref to resolve
 * @param node - The current AST node
 */
const resolveTypeReference = (refName: string, node: ts.Node) => {
	if (ts.isInterfaceDeclaration(node) && node.name.escapedText === refName) {
		return node;
	}

	for (const childNode of node.getChildren()) {
		return resolveTypeReference(refName, childNode);
	}
}

/**
 * Get all the TS params for a given node
 *
 * @param node - The current AST node
 */
const getParams = (node: ts.Node) => {
	// TODO: check to see if symbol
	if (ts.isTypeLiteralNode(node) || ts.isTypeReferenceNode(node)) {
		const params = [];
		/*
		 * Reference node, grab params and get outta here. Starting at the source
		 * as it's assumed the reference is defined at the top level... might
		 * save some time
		 */
		if (ts.isTypeReferenceNode(node)) {
			const resolvedRefNode: ts.Node = resolveTypeReference(node.getText(), source);

			resolvedRefNode.forEachChild((childNode) => {

				// It seems the Identifier is a child of the ref node - ignore
				if (ts.isPropertySignature(childNode)) {
					// @ts-ignore
					params.push(childNode.name.escapedText)
				}
			});

			return params;
		} else {
			node.forEachChild((param) => {
				// @ts-ignore
				params.push(param.name.escapedText);
			});

			return params;
		}
	}

	for (const childNode of node.getChildren()) {
		const result = getParams(childNode);

		if (result) return result;
	}
}

/**
 * Find comment ranges for the React AST node
 *
 * @param node - The current AST node
 */
const findCommentRanges = (node: ts.Node) => {
	const commentRanges = ts.getLeadingCommentRanges(
		source.getFullText(),
		node.getFullStart()
	);

	if (commentRanges?.length) {
		const commentStrings = commentRanges.map((range) =>
			tsdoc.TextRange.fromStringRange(node.getSourceFile().getFullText(), range.pos, range.end)
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
const formatParamBlock = (node: any) => {
	if (node instanceof tsdoc.DocPlainText) {
		return node.text.toString();
	}

	for (const childNode of node.getChildNodes()) {
		return formatParamBlock(childNode);
	}
}

/**
 * Determines if a param is required from its name
 *
 * @param paramName - The param name to check
 * @param node - The current AST node
 */
const isParamRequired = (paramName: string, node: ts.Node) => {
	if (ts.isPropertySignature(node)) {
		// @ts-ignore
		const nodeName: any = node.name?.escapedText;

		if (nodeName === paramName) return !node.questionToken;
	}

	for (const childNode of node.getChildren()) {
		const isMatch = isParamRequired(paramName, childNode);

		if (isMatch) return true;
	}

	return false;
}

/**
 * Gets the default value (if any) for a param from its name
 * @param paramName - The param name to check
 * @param node - The current AST node
 */
const getParamDefault = (paramName: string, node: ts.Node) => {
	if (ts.isBindingElement(node)) {
		// @ts-ignore
		const nodeName: any = node.name?.escapedText;

		// @ts-ignore
		if (nodeName === paramName) {
			if (node.getChildCount() > 1) {
				const children = node.getChildren();
				return children[children.length - 1].getText();
			}

			return false;
		}
	}

	for (const childNode of node.getChildren()) {
		const result = getParamDefault(paramName, childNode);

		if (result) return result;
	}
}

/**
 * Walk the AST and find React components
 *
 * @param node - The current AST node
 */
const generateDocs = (node: ts.Node) => {
	if (isReactComponent(node)) {
		const component: any = findJSXParentComponent(node);

		// Set component description
		doc.description = component.jsDoc[0].comment;

		const params = getParams(component);

		params.map((param: string) => {
			doc.props[param] = PARAM_DEFAULT
		});

		// Add descriptions for documented params
		const commentRanges = findCommentRanges(component);
		commentRanges.map((range) => {
			const comment: tsdoc.DocComment = parseTSDoc(range);
			comment.params.blocks.forEach((paramBlock: tsdoc.DocParamBlock) => {

				// Don't document params that aren't omitted from TS
				if (doc.props[paramBlock.parameterName]) {
					doc.props[paramBlock.parameterName] = {
						description: formatParamBlock(paramBlock.content)
					}
				}
			});
		});

		// Grab TS-inferred properties for each param
		for (const param in doc.props) {
			const paramDefaultValue = getParamDefault(param, component);

			// TOOD: Modify this to check type ref if one exists
			const paramIsRequired = isParamRequired(param, component);

			doc.props[param] = {
				...doc.props[param],
				required: paramIsRequired,
				defaultValue: paramDefaultValue && {
					value: paramDefaultValue,
					computed: false // What does this mean
				},
				tsType: {
					name: 'string' // TODO fxn here
				}
			}
		};

		return doc;
	}

	return node.forEachChild(generateDocs);
}

// TODO: Validate TS first? Trust it's clean? Idfk.
console.log(JSON.stringify(generateDocs(source), null, 4));
