import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...nextVitals,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]
