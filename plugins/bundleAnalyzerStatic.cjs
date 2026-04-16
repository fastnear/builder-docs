const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function bundleAnalyzerStaticPlugin() {
  return {
    name: 'fastnear-bundle-analyzer-static',
    configureWebpack(config, isServer) {
      if (isServer || !process.env.BUNDLE_REPORT_PATH) {
        return {};
      }
      return {
        plugins: [
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: process.env.BUNDLE_REPORT_PATH,
            openAnalyzer: false,
            generateStatsFile: Boolean(process.env.BUNDLE_STATS_PATH),
            statsFilename: process.env.BUNDLE_STATS_PATH || 'stats.json',
          }),
        ],
      };
    },
  };
};
