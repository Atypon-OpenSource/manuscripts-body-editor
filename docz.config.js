export default {
  typescript: true,
  modifyBundlerConfig: bundlerConfig => {
    bundlerConfig.module.rules.push({
      test: /.css$/,
      use: ['style-loader', 'css-loader'],
    })
    return bundlerConfig
  },
}
