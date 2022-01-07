import { Project, SyntaxKind } from 'ts-morph';
import { resolveType, getInitializer, getDeclarationParams } from '../paramsHelper';

/**
 * resolveType
 */
describe('resolveType function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('resolves existing type literal', () => {
		const testFile = `
			const Button = (props: {
				foo: boolean
				bar: string
			}) => {};
		`;

		const sourceFile = project.createSourceFile('test.ts', testFile);
		const typeLiteral = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction).getParameters()[0]

		expect(resolveType(typeLiteral)!.getKind()).toEqual(SyntaxKind.TypeLiteral);
	});

	test('resolves type ref to interface declaration', () => {
		const testFile = `
			interface ButtonTypes {
				foo: boolean
				bar: string
			};
			const Button = (props: ButtonTypes) => {};
		`;

		const sourceFile = project.createSourceFile('test.ts', testFile);
		const typeLiteral = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction).getParameters()[0]

		expect(resolveType(typeLiteral)!.getKind()).toEqual(SyntaxKind.InterfaceDeclaration);
	});

	test('returns null if no interface declaration is found', () => {
		const testFile = `
			const Button = (props: ButtonTypes) => {};
		`;

		const sourceFile = project.createSourceFile('test.ts', testFile);
		const typeLiteral = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction).getParameters()[0]

		expect(resolveType(typeLiteral)).toBeNull();
	});
});

/**
 * getInitializer
 */
describe('getInitializer function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('gets initializer', () => {
		const testFile = `
			const Button = ({
				foo = 'bar'
			}: {
				foo: string
			}) => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const bindings = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ObjectBindingPattern);

		expect(getInitializer(bindings, 'foo')).toEqual("'bar'");
	});

	test('returns undefined for missing initializer', () => {
		const testFile = `
			const Button = ({
				foo
			}: {
				foo: string
			}) => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const bindings = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ObjectBindingPattern);

		expect(getInitializer(bindings, 'foo')).toBeUndefined();
	});
});

/**
 * getDeclarationParams
 */
describe('getDeclarationParams function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('get all the params for a given node', () => {
		const testFile = `
			const Button = ({
				foo
			}: {
				foo: string
			}) => {};
		`;

		const sourceFile = project.createSourceFile('test.ts', testFile);
		const arrFunc = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

		expect(getDeclarationParams(arrFunc)).toEqual({foo: {required: true, type: {name: 'string'}}});
	});
});
