module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './src',
    coverageDirectory: '../coverage',
    globals: {
        'ts-jest': {
            diagnostics: false,
        }
    },
};