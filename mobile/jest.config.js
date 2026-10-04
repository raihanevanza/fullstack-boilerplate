module.exports = {
  preset: '@react-native/jest-preset',
  // ESM packages that must go through Babel (the RN preset resolves the "react-native" export condition)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|immer|@reduxjs|react-redux|redux|reselect|redux-thunk|lucide-react-native)/)',
  ],
};
