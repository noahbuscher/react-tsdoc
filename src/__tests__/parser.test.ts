import { Project } from 'ts-morph';
import { generateDocsForFile  } from '../parser';

/**
 * generateDocsForFile
 */
describe('generateDocsForFile function', () => {
	let project: Project;
	beforeEach(() => { project = new Project({ useInMemoryFileSystem: true }) });

	test('generates docs from a give sourceFile', () => {
		const testFile = `
			/**
			 * Button
			 * @prop foo - Is a boolean
			 * @prop bar - Is a string
			 */
			const Button = ({
				foo,
				bar
			}: {
				foo: boolean
				bar: string
			}) => {};

			export default Button
		`;
		const sourceFile = project.createSourceFile('test.ts', testFile);

		const docs = generateDocsForFile(sourceFile);

		expect(docs.description).toEqual('Button');
		expect(Object.keys(docs.props)).toHaveLength(2);
	});
});
