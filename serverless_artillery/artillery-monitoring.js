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


const sampling = require('./sampling.js')
const planning = require('./planning.js')
const analysis = require('./analysis.js')
const alert = require('./alert.js')

const artilleryMonitoring = artillery => ({
  execute: (timeNow, script, settings) => {
    const monitorScript = sampling.applyMonitoringSamplingToScript(script, settings)

    const plans = planning.planSamples(timeNow, monitorScript, settings)

    return artillery.executeAll(monitorScript, settings, plans, timeNow)
      .then(results => analysis.analyzeMonitoring(timeNow, script, settings, results))
      .then((monitoringResults) => {
        if (monitoringResults.errorMessage) {
          return alert.send(script, monitoringResults)
            .then(() => monitoringResults)
        }

        return monitoringResults
      })
  },
})

module.exports = artilleryMonitoring
