// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  
// Licensed under the Apache License, Version 2.0 (the "License").
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/* eslint-disable no-underscore-dangle */
const fs = require('fs')
const { safeLoad } = require('js-yaml')
const merge = require('lodash.merge')
const omit = require('lodash.omit')
const task = require('./artillery-task.js')
const platform = require('./platform-settings.js')
const path = require('path')
const promisify = require('util-promisify')

const mergeFileField = '>>'

const readFileAsync = promisify(fs.readFile)

const lambdaHandler = {
  handleUnhandledRejection: (ex) => {
    console.log('###############################################################')
    console.log('##             !! Unhandled promise rejection !!             ##')
    console.log('## This probably results from an unforseen circumstance in   ##')
    console.log('## a plugin.  Please report the following stack trace at:    ##')
    console.log('## https://github.com/Nordstrom/serverless-artillery/issues  ##')
    console.log('###############################################################')
    console.log(ex.stack)
    console.log('###############################################################')

    throw ex
  },

  getMergeFilePath: (
    mergeFileInput,
    resolve = path.resolve,
    dirname = __dirname
  ) => {
    const reject = message => Promise.reject(new Error(message))
    if (!mergeFileInput || typeof mergeFileInput !== 'string') {
      return reject(`'${typeof mergeFileInput}' is not a valid path.`)
    }
    const absolutePath = resolve(mergeFileInput)
    if (!absolutePath.startsWith(dirname)) {
      return reject(`Merge file ${absolutePath} is not a local file path.`)
    }
    return Promise.resolve(absolutePath)
  },

  readMergeFile: (
    mergeFilePath,
    readFile = readFileAsync,
    error = console.error,
    getMergeFilePath = lambdaHandler.getMergeFilePath
  ) =>
    getMergeFilePath(mergeFilePath)
      .then(readFile)
      .then(safeLoad)
      .catch((ex) => {
        error('Failed to read merge file.', mergeFilePath, ex.stack)
        throw ex
      }),

  mergeIf: (script, readMergeFile = lambdaHandler.readMergeFile) =>
    (mergeFileField in script
      ? readMergeFile(script[mergeFileField])
        .then(inputData => merge({}, inputData, omit(script, [mergeFileField])))
      : Promise.resolve(script)),

  createHandler: (taskToExecute, platformSettings) =>
    (event, context, callback) => {
      try {
        const script = event
        script._funcAws = {
          functionName: context.functionName,
        }
        const settings = platformSettings.getSettings(script)

        lambdaHandler.mergeIf(script)
          .then(mergedScript => taskToExecute.executeTask(mergedScript, settings))
          .then((result) => {
            if (process.env.SA_DEBUG) console.log(`LambdaResult ${JSON.stringify(result)}`)
            callback(null, result)
          })
          .catch((ex) => {
            console.log(ex.stack)
            if (process.env.SA_DEBUG) console.log(`LambdaResult ${JSON.stringify(ex)}`)
            callback(null, `Error executing task: ${ex.message}`)
          })
      } catch (ex) {
        console.log(ex.stack)
        if (process.env.SA_DEBUG) console.log(`LambdaResult ${JSON.stringify(ex)}`)
        callback(null, `Error validating event: ${ex.message}`)
      }
    },
}

process.on('unhandledRejection', lambdaHandler.handleUnhandledRejection)

module.exports.handler = lambdaHandler.createHandler(task, platform)
module.exports.lambdaHandler = lambdaHandler
