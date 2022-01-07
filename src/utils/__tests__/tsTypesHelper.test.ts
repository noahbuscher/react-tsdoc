import { Project, SyntaxKind } from 'ts-morph';
import {
	getTypeSignature
} from '../tsTypesHelper';

/**
 * getTypeSignature
 */
describe('getTypeSignature function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('simple: correctly gets type data for a string', () => {
		const testFile = `const Foo = ({foo}:{foo:string}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('string');
	});

	test('simple: correctly gets type data for a number', () => {
		const testFile = `const Foo = ({foo}:{foo:number}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('number');
	});

	test('correctly gets type data for a boolean', () => {
		const testFile = `const Foo = ({foo}:{foo:boolean}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('boolean');
	});

	test('correctly gets type data for an any', () => {
		const testFile = `const Foo = ({foo}:{foo:any}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('any');
	});

	test('correctly gets type data for a void', () => {
		const testFile = `const Foo = ({foo}:{foo:void}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('void');
	});

	test('correctly gets type data for an Object', () => {
		const testFile = `const Foo = ({foo}:{foo:Object}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('Object');
	});

	test('correctly gets type data for a String', () => {
		const testFile = `const Foo = ({foo}:{foo:String}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('String');
	});
});
