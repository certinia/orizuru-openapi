# Nozomi OpenAPI schema generator.

Nozomi OpenAPI generator is a module that can generate an OpenAPI document from a set of Avro schemas.

## Install

```
$ npm install @financialforcedev/nozomi-openapi
```

### Usage

```javascript

const
	openapiGenerator = require('@financialforcedev/nozomi-openapi').generator;

schemaMap = {
  'question': require('./question')
};
 
app.get('/openapi/v2', openapiGenerator.generateV2({
  version: '1.0.0',
  title: 'Test',
  description: 'Desc'
}, 'localhost:3000', '/api', ['http'], schemaMap));

```