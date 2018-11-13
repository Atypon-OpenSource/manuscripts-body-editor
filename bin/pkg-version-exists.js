#!/usr/bin/env node

const { execSync } = require('child_process')
const pkg = require(`${__dirname}/../package.json`)

const info = execSync(`npm view ${pkg.name} versions --json`, {
  encoding: 'utf-8'
})

const published = JSON.parse(info).includes(pkg.version) ? 'true' : 'false'

console.log(published)
