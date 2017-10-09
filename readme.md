# Nozomi OpenAPI schema generator.

Nozomi OpenAPI generator is a module that can generate an OpenAPI document from a map of service name to [Avro](https://avro.apache.org/) schemas. Each schema represents an input event that is exposed as a **POST** path, within the OpenAPI definition. 

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
  description: 'My description'
}, 'localhost:3000', '/api', ['http'], schemaMap));

```

## Response schema

The Nozomi project is aimed at asynchronous use cases, so the response schema is always a simple id string.

```javascript

schema: {
	type: 'object',
	required: ['id'],
		properties: {
		id: {
			type: 'string'
		}
	}
}

```
