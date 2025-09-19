module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.svg'
	],
	swDest: 'public/sw.ls',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};