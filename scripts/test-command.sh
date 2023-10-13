#!/bin/bash
GREEN='\033[0;32m'
NO_COLOR='\033[0m' 

if [ $# -ne 0 ]
  then
    printf "\n>> ${GREEN}Running test file(s): ${1}${NO_COLOR}\n"
else
  printf "\n>> ${GREEN}No files specified -- running all tests${NO_COLOR}\n"
fi

# Now run the command whether a test file was specified
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config ./jest.config.js --detectOpenHandles --runInBand src/tests/${1}
