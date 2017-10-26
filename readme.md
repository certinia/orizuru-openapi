# Orizuru OpenAPI schema generator.

Orizuru OpenAPI generator is a module that can generate an OpenAPI document from a map of service name to [Avro](https://avro.apache.org/) schemas. Each schema represents an input event that is exposed as a **POST** path, within the OpenAPI definition.

Currently [OpenAPI version 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) documents are generated. 

## Install

```
$ npm install @financialforcedev/orizuru-openapi
```

### Usage

```javascript

const
	openapiGenerator = require('@financialforcedev/orizuru-openapi').generator;

schemaMap = {
  'question': require('./question')
};
 
app.get('/openapi/v2', openapiGenerator.generateV2({
	info: {
		version: '1.0.0',
		title: 'Test',
		description: 'My description'
	}, 
	host: 'localhost:3000', 
	basePath: '/api', 
	schemes: ['http']
}, schemaMap));

```

## Response schema

The Orizuru project is aimed at asynchronous use cases, so the response schema is always a simple id string.

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
## API Docs

Click to view [JSDoc API documentation](http://htmlpreview.github.io/?https://github.com/financialforcedev/orizuru-openapi/blob/master/doc/index.html).
