interface DocProp {
	description: string
	required: boolean
	tsType: import('./utils/tsTypesHelper').TypeSignature
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
