module.exports = {
  root: true,
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  settings: {
    next: {
      rootDir: ['./'],
    },
  },
  rules: {
    'next/no-html-link-for-pages': 'off',
  },
};

