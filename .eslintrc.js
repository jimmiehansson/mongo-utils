module.exports = {
  env: {
    node: true,
    es6: true
  },
  "parserOptions": {
    "ecmaVersion": 8
  },
  rules: {
    'comma-dangle': 'off',
    'no-console': ['error', {
      'allow': ['warn', 'info', 'error']
    }],
    // adjust max-len to ignore comments
    'max-len': ['error', 100, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      code: 80,
      tabWidth: 4,
      ignoreTrailingComments: false
    }]
  }
}
