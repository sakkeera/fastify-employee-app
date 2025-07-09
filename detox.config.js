module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  apps: {
    fastifyApp: {
      binaryPath: 'node',
      build: 'npm run start'
    }
  },
  devices: {
    fastifyDevice: {
      type: 'node',
      device: { type: 'localhost', port: 3000 }
    }
  },
  configurations: {
    fastify: {
      device: 'fastifyDevice',
      app: 'fastifyApp'
    }
  }
}; 