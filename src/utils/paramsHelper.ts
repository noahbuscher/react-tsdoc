import {
	SyntaxKind,
	Node,
	ArrowFunction,
	FunctionDeclaration,
	PropertySignature,
	TypeLiteralNode,
	TypeReferenceNode,
	ObjectBindingPattern
} from 'ts-morph';

import { getTypeSignature } from './typesHelper';

/**
 * Resolves a type ref (or returns the literal)
 *
 * @param node - Type literal or ref to resolve
 */
export const resolveType = (node: Node): TypeLiteralNode|TypeReferenceNode|null => {
	if (!node) return null;

	// Grab type literal, if any
	const typeLiteral = node?.getLastChildByKind(SyntaxKind.TypeLiteral);

	// Type literal found, but empty, return
	if (typeLiteral && typeLiteral.getChildCount() === 0) return null;

	// Must be a ref
	if (!typeLiteral) {
		const typeRef = node?.getFirstChildByKindOrThrow(SyntaxKind.TypeReference);

		if (!typeRef) return null;

		const typeRefIdentifier = typeRef.getFirstChildByKindOrThrow(SyntaxKind.Identifier);

		if (!typeRefIdentifier) return null;

		// First index is the root definition node
		return <TypeLiteralNode | TypeReferenceNode>typeRefIdentifier.getDefinitionNodes()[0] || null;
	}

	return typeLiteral;
}

/**
 * Look for complimentary initializer to param
 *
 * @param properties - The properties node
 * @param paramName - The name of the param
 */
export const getInitializer = (properties: ObjectBindingPattern, paramName: string): string => {
	return properties?.forEachChild((child: any) => {
		if (child.getKind() === SyntaxKind.BindingElement
			&& paramName === child.getFirstChildByKind(SyntaxKind.Identifier)?.getText()
		) {
			return child.getInitializer()?.getText();
		}
	});
}

/**
 * Get all the TS params for a given node
 *
 * @param node - The current AST node
 */
export const getDeclarationParams = (node: ArrowFunction|FunctionDeclaration): {[param: string]: reactTSDoc.Param}|undefined => {
	if (!node) return undefined;

	const params = {};
	const paramsNode = node.getParameters()[0];

	// No params
	if (!paramsNode) return undefined;

	const propertiesNode = paramsNode.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);
	const typeNode = resolveType(paramsNode);

	if (!typeNode) return undefined;

	typeNode.getChildrenOfKind(SyntaxKind.PropertySignature).forEach((param: PropertySignature) => {
		const paramName = param.getFirstChildByKind(SyntaxKind.Identifier)?.getText() || '';
		const initializer = propertiesNode ? getInitializer(propertiesNode, paramName) : undefined;

		params[paramName] = {
			required: !param.getQuestionTokenNode(),
			initializer,
			type: getTypeSignature(param)
		};
	});

	return params;
}
