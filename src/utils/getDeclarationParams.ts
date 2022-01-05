import {
	SyntaxKind,
	Node,
	ArrowFunction,
	FunctionDeclaration,
	PropertySignature,
	TypeLiteralNode,
	TypeReferenceNode,
} from 'ts-morph';

import { getTypeSignature } from './tsTypesHelper';

/**
 * Get all the TS params for a given node
 *
 * @param node - The current AST node
 */
export const getDeclarationParams = (node: ArrowFunction|FunctionDeclaration) => {
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
	nodeTypeParams.forEachChild((typeNode: Node|PropertySignature) => {
		const paramIdentifier = typeNode.getFirstChildByKind(SyntaxKind.Identifier);
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
			required: !typeNode.getQuestionTokenNode(),
			initializer,
			// @ts-ignore
			type: getTypeSignature(typeNode)
		}
	});

	return params;
}
