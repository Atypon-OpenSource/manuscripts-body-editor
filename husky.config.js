module.exports = {
  "hooks": {
    "pre-push": "yarn typecheck && yarn lint"
  }
}
