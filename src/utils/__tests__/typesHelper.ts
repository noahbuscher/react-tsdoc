import { Project, SyntaxKind } from 'ts-morph';
import {
	getTypeSignature
} from '../typesHelper';

/**
 * getTypeSignature
 */
describe('getTypeSignature function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('correctly gets type data for a string', () => {
		const testFile = `const Foo = ({foo}:{foo:string}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('string');
	});

	test('correctly gets type data for a number', () => {
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

	test('correctly gets type data for a union', () => {
		const testFile = `const Foo = ({foo}:{foo: string|boolean}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('union');
		expect(property.elements).toHaveLength(2);
		expect(property.elements[0].name).toEqual('string');
		expect(property.elements[1].name).toEqual('boolean');
	});

	test('correctly gets type data for an array', () => {
		const testFile = `const Foo = ({foo}:{foo: boolean[]}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('Array');
		expect(property.elements).toHaveLength(1);
		expect(property.elements[0].name).toEqual('boolean');
	});

	test('correctly gets type data for a tuple', () => {
		const testFile = `const Foo = ({foo}:{foo: [baz, bar]}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('tuple');
		expect(property.elements).toHaveLength(2);
		expect(property.elements[0].name).toEqual('baz');
		expect(property.elements[1].name).toEqual('bar');
	});

	test('correctly gets type data for a property signature', () => {
		const testFile = `const Foo = ({foo}:{foo: { foo: string }}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('signature');
		expect(property.type).toEqual('object');
		expect(property.signature).toHaveProperty('properties');
		expect(property.signature!.properties).toHaveLength(1);
		expect(property.signature!.properties![0].key).toEqual('foo');
		expect(property.signature!.properties![0].value).toEqual({ name: 'string', required: true });
	});

	test('correctly gets type data for an index signature', () => {
		const testFile = `const Foo = ({foo}:{foo: {[key: string]: bar}}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('signature');
		expect(property.type).toEqual('object');
		expect(property.signature).toHaveProperty('properties');
		expect(property.signature!.properties).toHaveLength(1);
		expect(property.signature!.properties![0].key).toEqual({ name: 'string' });
		expect(property.signature!.properties![0].value).toEqual({ name: 'bar', required: true });
	});

	test('correctly gets type data for a function signature', () => {
		const testFile = `const Foo = ({foo}:{foo: (x: string) => void}) => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertySignature);

		const property = getTypeSignature(component);

		expect(property).toBeDefined();
		expect(property.name).toEqual('signature');
		expect(property.type).toEqual('function');
		expect(property.signature).toHaveProperty('arguments');
		expect(property.signature!.arguments).toHaveLength(1);
		expect(property.signature!.arguments![0].name).toEqual('x');
		expect(property.signature!.arguments![0].type).toEqual({ name: 'string' });
		expect(property.signature!.return).toEqual({ name: 'void' });
	});
});
