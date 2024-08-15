export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    'postcss-nesting': {},
    cssnano: {
      preset: 'default',
    },
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};
