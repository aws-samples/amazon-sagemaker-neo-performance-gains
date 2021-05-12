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

module.exports = {
    setRequest: setRequest,
}

const optimized_endpoint = 'neo-optimized-c5';
const unoptimized_endpoint = 'unoptimized-c5';

const crypto = require('crypto');
const strftime = require('strftime');
const utf = require('utf8');

const region = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;

const method = 'POST';
const service = 'sagemaker'; 
const host = 'runtime.sagemaker.' + region + '.amazonaws.com'; 

const contentType = 'text/csv'; 
const canonicalQuerystring = '';
const signedHeaders = 'content-type;host;x-amz-date;x-amz-security-token';
const algorithm = 'AWS4-HMAC-SHA256';


function getSignatureKey(key, dateStamp, regionName, serviceName) {

  const kDate = crypto.createHmac('sha256', utf.encode('AWS4'+ key)).update(utf.encode(dateStamp)).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(utf.encode(regionName)).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(utf.encode(serviceName)).digest();
  const kSigning = crypto.createHmac('sha256', kService).update(utf.encode('aws4_request')).digest();

  return kSigning;

};


function setRequest(requestParams, context, _, next) {
  
  let endpoint = '';
  if (requestParams.url.includes('unoptimizedEndpointName')){
      endpoint = unoptimized_endpoint;
  } else if (requestParams.url.includes('optimizedEndpointName')) {
      endpoint = optimized_endpoint;
  }

  let body = '';
  for (let i = 0; i < context.vars.numRowsInRequest; i++) {
    let row = '2,0.675,0.55,0.175,1.689,0.694,0.371,0.474\n';
    body += row;
  };
  body = body.slice(0, body.length-2);

  const canonicalUri = '/endpoints/' + endpoint + '/invocations';
  const amzDate = strftime('%Y%m%dT%H%M%SZ', new Date(new Date().toUTCString()));
  const dateStamp = strftime('%Y%m%d', new Date(new Date().toUTCString()));

  const canonicalHeaders = 'content-type:' + contentType + '\n' + 'host:' + host + '\n' + 'x-amz-date:' + amzDate + '\n' + 'x-amz-security-token:' + sessionToken + '\n';
  const payloadHash = crypto.createHash('sha256').update(utf.encode(body)).digest('hex');
  
  const canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHash;

  const credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
  const stringToSign = algorithm + '\n' +  amzDate + '\n' +  credentialScope + '\n' +  crypto.createHash('sha256').update(utf.encode(canonicalRequest)).digest('hex');

  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(utf.encode(stringToSign)).digest('hex');

  const authorizationHeader = algorithm + ' ' + 'Credential=' + accessKey + '/' + credentialScope + ', ' +  'SignedHeaders=' + signedHeaders + ', ' + 'Signature=' + signature;
  
  const headers = {
      'Content-Type': contentType,
      'X-Amz-Date': amzDate,
      'Authorization': authorizationHeader,
      'X-Amz-Security-Token': sessionToken
  };

  requestParams.headers = headers;
  requestParams.body = body;

  return next();

};
