#!/usr/bin/env node

const { execSync } = require('child_process')
const { name, version } = require('../package.json')

const versions = execSync(`npm view ${name} versions --json`, {
  encoding: 'utf-8'
})

if (!JSON.parse(versions).includes(version)) {
  execSync('npm publish')
}
