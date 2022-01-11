declare namespace reactTSDoc {
	interface DocProp {
		description: string
		required: boolean
		tsType: TypeSignature
		defaultValue?: {
			computed: boolean
			value: any
		}
	}

	interface PropsMap {
		[name: string]: DocProp
	}

	interface Doc {
		description: string
		props: PropsMap
	}

	interface TypeSignature {
		name?: string
		value?: any
		key?: string|any
		required?: boolean
		type?: string
		signature?: {
			properties?: TypeSignature[],
			arguments?: TypeSignature[]
			return?: TypeSignature
		}
		elements?: any
		raw?: string
	}

	interface Param {
		required: boolean
		initializer?: string
		type: TypeSignature
	}
}
