import { Project, SyntaxKind } from 'ts-morph';
import {
	findCommentRanges,
	parseTSDoc,
	renderPropBlock,
	renderCommentSummary,
	getDeclarationDescription,
	getPropBlocks
} from '../tsDocHelper';

/**
 * findCommentRanges
 */
describe('findCommentRanges function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('correctly finds comment ranges for a node', () => {
		const testFile = `
			/**
			 * Foo
			 * @param bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);

		const range = findCommentRanges(component);

		expect(range).toHaveLength(1);
		expect(range[0].end).toEqual(47);
		expect(range[0].pos).toEqual(4);
	});

	test('correctly returns empty array if there are no comment ranges', () => {
		const testFile = `const Foo = () => {};`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);

		const range = findCommentRanges(component);

		expect(range).toHaveLength(0);
	});
});

/**
 * parseTSDoc
 */
describe('parseTSDoc function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('parses a given comment withour error', () => {
		const testFile = `
			/**
			 * Foo
			 * @prop bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);
		const range = findCommentRanges(component);

		const parseDocs = parseTSDoc(range[0]);

		expect(parseDocs!.customBlocks).toHaveLength(1);
	});
});

/**
 * renderPropBlock
 */
describe('renderPropBlock function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('gets propName and content from given block', () => {
		const testFile = `
			/**
			 * Foo
			 * @prop bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);
		const range = findCommentRanges(component);
		const parseDocs = parseTSDoc(range[0]);

		const prop = renderPropBlock(parseDocs!.customBlocks[0].content);

		expect(prop!.propName).toEqual('bar');
		expect(prop!.content).toEqual('baz');
	});
});

/**
 * renderCommentSummary
 */
describe('renderCommentSummary function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('gets the summary (description) as string from a block', () => {
		const testFile = `
			/**
			 * Some description
			 * @prop bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableStatement);
		const range = findCommentRanges(component);
		const parseDocs = parseTSDoc(range[0]);

		expect(parseDocs).not.toBeUndefined();

		if (parseDocs) {
			const summary = renderCommentSummary(parseDocs);

			expect(summary).toEqual('Some description');
		}
	});
});

/**
 * getDeclarationDescription
 */
describe('getDeclarationDescription function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('gets the summary as string from a component declaration', () => {
		const testFile = `
			/**
			 * Some description
			 * @prop bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
		const summary = getDeclarationDescription(component);

		expect(summary).toEqual('Some description');
	});
});

/**
 * getPropBlocks
 */
describe('getPropBlocks function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('gets the prop blocks from a component', () => {
		const testFile = `
			/**
			 * Some description
			 * @prop bar - baz
			 */
			const Foo = () => {};
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);
		const component = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.VariableDeclaration);
		const propBlocks = getPropBlocks(component);

		expect(propBlocks).toHaveLength(1);
		expect(propBlocks[0].blockTag.tagName).toEqual('@prop');
	});
});
