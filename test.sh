#!/bin/sh

set -eo pipefail

function t {
  yarn test --passWithNoTests $@
}

case "$1" in
  "basic")
    t --testMatch '<rootDir>/tests/**/*.spec.*'
    ;;
  "with-heroku-deploy")
    t --testMatch '<rootDir>/with-heroku-deploy/**/*.spec.*'
    ;;
  "with-tailwind")
    t --testMatch '<rootDir>/with-tailwind/**/*.spec.*'
    ;;
  "none")
    ;;
  *)
    echo "Error: Unrecongnized task: $1"
    exit 1
esac