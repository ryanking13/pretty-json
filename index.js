addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const params = new URL(request.url).searchParams
  const url = params.get('url')
  const highlight = params.get('hl') === "1"

  if (url === null) {
    return new Response('`url` parameter not given')
  }

  req = new Request(url, request)
  req.headers.set('Origin', new URL(url).origin)

  const response = await fetch(req, contentTypeJson)
  const results = await gatherResponse(response)

  if (highlight) {
    return new Response(wrapJSON(highlightJSON(results)), contentTypeHTML)
  } else {
    return new Response(results, contentTypeJson)
  }

}

const contentTypeJson = {
  headers: {
    'content-type': 'application/json; charset=UTF-8',
  },
}

const contentTypeHTML = {
  headers: {
    'content-type': 'text/html; charset=UTF-8',
  },
}

// Adapted from: https://developers.cloudflare.com/workers/templates/pages/fetch_json/
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json(), null, 2)
  } else if (contentType.includes('application/text')) {
    return await response.text()
  } else if (contentType.includes('text/html')) {
    return await response.text()
  } else {
    return await response.text()
  }
}

// Adapted from: https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript
function highlightJSON(json) {
  if (typeof json != 'string') {
    json = JSON.stringify(json, undefined, 2)
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number'
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key'
      } else {
        cls = 'string'
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean'
    } else if (/null/.test(match)) {
      cls = 'null'
    }
    return '<span class="' + cls + '">' + match + '</span>'
  });
}

function wrapJSON(json) {
  return `
<html>
  <head>
    <style>
      pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; }
      .string { color: green; }
      .number { color: darkorange; }
      .boolean { color: blue; }
      .null { color: magenta; }
      .key { color: red; }
    </style>
  </head>
  <body>
    <pre style="outline: none;">${json}</pre>
  </body>
</html>`
}