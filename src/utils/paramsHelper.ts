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

import { getTypeSignature } from './tsTypesHelper';

/**
 * Resolves a type ref (or returns the literal)
 *
 * @param node - Type literal or ref to resolve
 */
const resolveType = (node: Node|TypeLiteralNode|TypeReferenceNode|undefined) => {
	if (!node) return [];

	// Grab type literal, if any
	const typeLiteral = node?.getLastChildByKind(SyntaxKind.TypeLiteral);

	// Type literal found, but empty, return
	if (typeLiteral && typeLiteral.getChildCount() === 0) return [];

	// Must be a ref
	if (!typeLiteral) {
		const typeRef = node?.getFirstChildByKindOrThrow(SyntaxKind.TypeReference);
		const typeRefIdentifier = typeRef.getFirstChildByKindOrThrow(SyntaxKind.Identifier);

		// First index is the root definition node
		return typeRefIdentifier.getDefinitionNodes()[0];
	}

	return typeLiteral;
}

/**
 * Look for complimentary initializer to param
 *
 * @param properties - The properties node
 * @param paramName - The name of the param
 */
const getInitializer = (properties: ObjectBindingPattern, paramName: string) => {
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
export const getDeclarationParams = (node: ArrowFunction|FunctionDeclaration) => {
	const params: [] = [];
	const paramsNode = node.getParameters()[0];
	const propertiesNode = paramsNode.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);
	const typeNode = resolveType(paramsNode);

	if (!propertiesNode) return [];

	// @ts-ignore
	typeNode.forEachChild((param: Node) => {
		if (param.getKind() !== SyntaxKind.PropertySignature) return;
		const paramName = param.getFirstChildByKind(SyntaxKind.Identifier)?.getText() || '';
		const initializer = getInitializer(propertiesNode, paramName);

		params[paramName] = {
			// @ts-ignore
			required: !param.getQuestionTokenNode(),
			initializer,
			// @ts-ignore
			type: getTypeSignature(param)
		}
	});

	return params;
}
