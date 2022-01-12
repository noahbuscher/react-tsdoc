import {
	PropertySignature,
	IndexSignatureDeclaration,
	SyntaxKind
} from 'ts-morph';

/**
 * Gets type data for a param
 *
 * @node - The property signature to check the type of
 */
export const getTypeSignature = (node: any): reactTSDoc.TypeSignature|undefined => {
	if (!node) return undefined;

	const kind = node?.getKind() === SyntaxKind.PropertySignature
		? node.getTypeNode()?.getKind()
		: node.getKind();

	switch (kind) {
		case (SyntaxKind.TypeReference): // foo
			return {
				name: node.getType().getText().toString()
			}
		case(SyntaxKind.LiteralType): // 'foobarbaz'
			return {
				name: 'literal',
				value: node.getType().getText().toString()
			};
		case(SyntaxKind.StringKeyword): // string
			return { name: 'string' };
		case(SyntaxKind.NumberKeyword): // number
			return { name: 'number' };
		case(SyntaxKind.BooleanKeyword): // boolean
			return { name: 'boolean' };
		case(SyntaxKind.AnyKeyword): // any
			return { name: 'any' };
		case(SyntaxKind.VoidKeyword): // void
			return { name: 'void' };
		case(SyntaxKind.UnionType): { // foo | bar
			const elements: any = [];
			const typeNode = node.getKind() === SyntaxKind.UnionType
				? node
				: node.getTypeNode();

			typeNode!.getTypeNodes()
				.forEach((childNode: any) =>
					elements.push(getTypeSignature(childNode))
				);

			return {
				name: 'union',
				raw: node.getType().getText(),
				elements
			}
		}
		case(SyntaxKind.ArrayType): { // foo[]
			const elements: any = [];
			const typeNode = node.getKind() === SyntaxKind.ArrayType
				? node
				: node.getTypeNode();

			typeNode.forEachChild((childNode: any) =>
				elements.push(getTypeSignature(childNode))
			);

			return {
				name: 'Array',
				raw: node.getType().getText(),
				elements: elements,
			};
		}
		case(SyntaxKind.TupleType): { // [foo, bar, baz]
			const elements: any = [];
			const typeNode = node.getKind() === SyntaxKind.TupleType
				? node
				: node.getTypeNode();

			typeNode.forEachChild((childNode: any) => {
				elements.push(getTypeSignature(childNode))
			});

			return {
				name: 'tuple',
				raw: node.getType().getText(),
				elements: elements
			};
		}
		case(SyntaxKind.FunctionType): { // (foo: string) => void
			const args: any = [];
			const typeNode = node.getKind() === SyntaxKind.FunctionType
				? node
				: node.getTypeNode();

			typeNode.forEachChild((childNode: any) => {
				if (childNode.getKind() === SyntaxKind.Parameter) {
					args.push({
						name: childNode.getFirstChildByKind(SyntaxKind.Identifier)?.getText(),
						type: getTypeSignature(childNode.getTypeNode())
					});
				}
			});

			return {
				name: 'signature',
				type: 'function',
				raw: node.getType().getText(),
				signature: {
					arguments: args,
					// @ts-ignore
					return: getTypeSignature(node.getTypeNode().getLastChild())
				}
			};
		}
		case(SyntaxKind.TypeLiteral): // {foo: bar} OR {[foo: string]: bar}
			const properties: reactTSDoc.TypeSignature[] = [];
			const typeNode = node.getKind() === SyntaxKind.TypeLiteral
				? node
				: node.getTypeNode();

			// @ts-ignore
			typeNode.forEachChild((childNode: PropertySignature|IndexSignatureDeclaration) => {
				if (childNode.getKind() === SyntaxKind.PropertySignature) {
					properties.push({
						key: childNode.getFirstChildByKind(SyntaxKind.Identifier)?.getText(),
						value: {
							...getTypeSignature(childNode.getLastChild()),
							// @ts-ignore
							required: !childNode.hasQuestionToken()
						}
					});
				}

				if (childNode.getKind() === SyntaxKind.IndexSignature) {
					const parameter = childNode.getFirstChildByKind(SyntaxKind.Parameter);

					properties.push({
						key: {
							name: parameter!.getType().getText()
						},
						value: {
							...getTypeSignature(childNode.getLastChild()),
							required: !parameter!.hasQuestionToken()
						}
					});
				}
			});

			return {
				name: 'signature',
				type: 'object',
				raw: node.getType().getText(),
				signature: {
					properties
				}
			};
		default: // unknown type
			return { name: 'unknown' };
	}
};
