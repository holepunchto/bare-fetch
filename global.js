const fetch = require('.')

global.fetch = fetch
global.Response = fetch.Response
global.Headers = fetch.Headers
