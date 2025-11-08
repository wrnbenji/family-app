module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NE használd az 'expo-router/babel' plugint SDK 50+ alatt
    plugins: [],
  };
};
