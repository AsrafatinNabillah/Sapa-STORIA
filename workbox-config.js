module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,html,css,json,png,ico}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};