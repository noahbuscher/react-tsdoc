import { PropertySignature, IndexSignatureDeclaration, SyntaxKind } from 'ts-morph';

/**
 * Gets type data for a param
 *
 * @node - The property signature to check the type of
 */
export const getTypeSignature = (node: PropertySignature): reactTSDoc.TypeSignature => {
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
			node.getFirstChildByKind(SyntaxKind.UnionType)?.getTypeNodes()
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
			node.getFirstChildByKind(SyntaxKind.ArrayType)
				?.forEachChild((childNode: any) =>
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
			node.getFirstChildByKindOrThrow(SyntaxKind.TupleType)
				?.forEachChild((childNode: any) => {
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
			node.getFirstChildByKindOrThrow(SyntaxKind.FunctionType)
				?.getParameters().forEach((childNode: any) => {
					args.push({
						name: childNode.getFirstChildByKind(SyntaxKind.Identifier)?.getText(),
						type: getTypeSignature(childNode.getTypeNode())
					})
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

			const typeLiteral = node.getFirstChildByKindOrThrow(SyntaxKind.TypeLiteral);

			// @ts-ignore
			typeLiteral.forEachChild((childNode: PropertySignature|IndexSignatureDeclaration) => {
				if (childNode.getKind() === SyntaxKind.PropertySignature) {
					properties.push({
						key: childNode.getFirstChildByKind(SyntaxKind.Identifier)?.getText(),
						value: {
							...getTypeSignature(<PropertySignature>childNode.getLastChild()),
							// @ts-ignore
							required: !childNode.hasQuestionToken()
						}
					});
				}

				if (childNode.getKind() === SyntaxKind.IndexSignature) {
					const parameter = childNode.getFirstChildByKindOrThrow(SyntaxKind.Parameter);

					properties.push({
						key: {
							name: parameter.getType().getText()
						},
						value: {
							...getTypeSignature(<PropertySignature>childNode.getLastChild()),
							required: !parameter.hasQuestionToken()
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
		default: // unknown type
			return { name: 'unknown' };
	}
};
