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


const modes = {
  names: {
    PERF: 'perf',
    PERFORMANCE: 'performance',
    ACC: 'acc',
    ACCEPTANCE: 'acceptance',
    MON: 'mon',
    MONITORING: 'monitoring',
  },

  isAcceptanceScript: script => script.mode && (script.mode === modes.names.ACC || script.mode === modes.names.ACCEPTANCE),
  isMonitoringScript: script => script.mode && (script.mode === modes.names.MON || script.mode === modes.names.MONITORING),
  isPerformanceScript: script => !script.mode || (script.mode && (script.mode === modes.names.PERF || script.mode === modes.names.PERFORMANCE)),
  isSamplingScript: script => modes.isAcceptanceScript(script) || modes.isMonitoringScript(script),

  validateScriptMode: (script) => {
    const validModes = Object.keys(modes.names).map(key => modes[key])
    const isScriptModeValid = script.mode === undefined || validModes.includes(script.mode.toLocaleLowerCase())

    if (!isScriptModeValid) {
      const listOfValidModes = validModes.map(mode => `"${mode}"`).join(', ')
      throw new Error(`If specified, the mode attribute must be one of: ${listOfValidModes}.`)
    }
  },

  getModeForDisplay: (script) => {
    if (modes.isAcceptanceScript(script)) return modes.ACCEPTANCE
    if (modes.isMonitoringScript(script)) return modes.MONITORING
    return modes.PERFORMANCE
  },
}

module.exports = Object.assign(modes, modes.names)
