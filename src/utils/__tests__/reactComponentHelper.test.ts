import { Project, SyntaxKind } from 'ts-morph';
import {
	isReactComponent,
	getComponentInitializer,
	getComponentFunction
} from '../reactComponentHelper';

/**
 * isReactComponent
 */
describe('isReactComponent function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('correctly verifies a node is a react component', () => {
		const testFile = `
			const Button = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);

		expect(isReactComponent(component)).toBeTruthy();
	});

	test('correctly verifies a node is not react component', () => {
		const testFile = `const foo = 'bar';`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);

		expect(isReactComponent(component)).toBeFalsy();
	});
});

/**
 * getComponentInitializer
 */
describe('getComponentInitializer function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('correctly grabs a variable statement from a provided arrow function', () => {
		const testFile = `
			const Button = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

		expect(getComponentInitializer(component)!.getKind()).toEqual(SyntaxKind.VariableStatement)
	});

	test('correctly returns a provided function declaration', () => {
		const testFile = `
			function Button () {}
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

		expect(getComponentInitializer(component)!.getKind()).toEqual(SyntaxKind.FunctionDeclaration)
	});
});

/**
 * getComponentFunction
 */
describe('getComponentFunction function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('correctly grabs the first arrow function in a node', () => {
		const testFile = `
			const Button = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);

		expect(getComponentFunction(sourceFile)!.getKind()).toEqual(SyntaxKind.ArrowFunction)
	});

	test('correctly returns a provided function declaration', () => {
		const testFile = `
			function Button () {}
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

		expect(getComponentFunction(component)!.getKind()).toEqual(SyntaxKind.FunctionDeclaration)
	});
});
