import { PropertySignature, TypeLiteralNode, Signature, IndexSignatureDeclaration, SyntaxKind } from 'ts-morph';

const SimpleTypes = [
	'string',
	'number',
	'boolean',
	'any',
	'void',
	'String',
	'Object'
];

export interface TypeSignature {
	name?: string
	value?: string|any
	key?: string|any
	required?: boolean
	type?: string
	signature?: { properties: TypeSignature[] }
	elements?: any
	raw?: string
}

/**
 * Gets type data for a param
 */
export const getTypeSignature = (node: PropertySignature): TypeSignature => {
	switch (node.getTypeNode()?.getKind()) {
		case(SyntaxKind.LiteralType):
			return {
				name: 'literal',
				value: node.getType().getText().toString()
			};
		case(SyntaxKind.StringKeyword):
			return { name: 'string' };
		case(SyntaxKind.NumberKeyword):
			return { name: 'number' };
		case(SyntaxKind.BooleanKeyword):
			return { name: 'boolean' };
		case(SyntaxKind.AnyKeyword):
			return { name: 'any' };
		case(SyntaxKind.VoidKeyword):
			return { name: 'void' };
		case(SyntaxKind.ArrayType):
			return {
				name: 'Array',
				elements: [{
					name: node.getType().getArrayElementType()?.getText()
				}],
				raw: node.getType().getText()
			};
		case(SyntaxKind.TypeLiteral):
			const properties: TypeSignature[] = [];

			const typeLiteral = node.getFirstChildByKindOrThrow(SyntaxKind.TypeLiteral);

			// @ts-ignore
			typeLiteral.forEachChild((childNode: PropertySignature|IndexSignatureDeclaration) => {
				if (childNode.getKind() === SyntaxKind.PropertySignature) {
					properties.push({
						key: childNode.getFirstChildByKind(SyntaxKind.Identifier)?.getText(),
						value: {
							name: childNode.getType().getText(),
							// @ts-ignore
							required: !childNode.hasQuestionToken()
						}
					});
				}

				if (childNode.getKind() === SyntaxKind.IndexSignature) {
					properties.push({
						key: {
							name: childNode.getFirstChildByKindOrThrow(SyntaxKind.Parameter).getType().getText()
						},
						value: {
							name: childNode.getType().getText(),
							required: true
						}
					});
				}
			})

			return {
				name: 'signature',
				type: 'object',
				raw: node.getType().getText(),
				signature: {
					properties
				}
			};
		default:
			return { name: 'unknown' };
	}
};
