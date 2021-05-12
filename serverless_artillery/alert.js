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


const aws = require('aws-sdk') // eslint-disable-line import/no-extraneous-dependencies

const sns = new aws.SNS()

const alert = {
  briefAnalysis: (analysis) => {
    const latencies = []
    analysis.reports.forEach((report, i) => {
      const current = report
      latencies[i] = current.latencies
      delete current.latencies
    })
    const ret = JSON.stringify(analysis, null, 2)
    analysis.reports.forEach((report, i) => {
      const current = report
      current.latencies = latencies[i]
    })
    return ret
  },
  send: (script, analysis) => {
    if (!process.env.TOPIC_ARN) {
      console.error([
        '#########################################################',
        '##         ! Required Configuration Missing !          ##',
        '## in order to send the alert, an environment variable ##',
        '## TOPIC_ARN must be available.  An alert was supposed ##',
        '## to be sent but one cannot be sent!                  ##',
        '#########################################################',
      ].join('\n'))
      return Promise.resolve()
    } else {
      const subject = `Alert: ${analysis.errorMessage}`
      const message = `Alert:
  ${analysis.errorMessage}

Logs:
Full analysis:
${alert.briefAnalysis(analysis)}
`
      const params = {
        Subject: subject,
        Message: message,
        TopicArn: process.env.TOPIC_ARN,
      }
      return sns.publish(params).promise()
    }
  },
}

module.exports = alert
