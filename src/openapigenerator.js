/**
 * Copyright (c) 2017, FinancialForce.com, inc
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *      this list of conditions and the following disclaimer in the documentation 
 *      and/or other materials provided with the distribution.
 * - Neither the name of the FinancialForce.com, inc nor the names of its contributors 
 *      may be used to endorse or promote products derived from this software without 
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

'use strict';

const

	avsc = require('avsc'),

	V2 = '2.0',
	CONTENT_TYPE = 'application/json',

	OPENAPI_TYPE_BOOLEAN = 'boolean',
	OPENAPI_TYPE_INTEGER = 'integer',
	OPENAPI_TYPE_NUMBER = 'number',
	OPENAPI_TYPE_STRING = 'string',
	OPENAPI_TYPE_BYTE = 'byte',
	OPENAPI_TYPE_OBJECT = 'object',
	OPEN_API_TYPE_ARRAY = 'array',

	REF_TAG = '$ref',
	DEF_ROOT = '#/definitions/',

	booleanTypeMapper = (definitionsState, type) => {
		return {
			type: OPENAPI_TYPE_BOOLEAN
		};
	},

	stringTypeMapper = (definitionsState, type) => {
		return {
			type: OPENAPI_TYPE_STRING
		};
	},

	integerTypeMapper = (definitionsState, type) => {
		return {
			type: OPENAPI_TYPE_INTEGER
		};
	},

	numberTypeMapper = (definitionsState, type) => {
		return {
			type: OPENAPI_TYPE_NUMBER
		};
	},

	byteTypeMapper = (definitionsState, type) => {
		return {
			type: OPENAPI_TYPE_BYTE
		};
	},

	recordReferenceMapper = (definitionsState, type) => {

		definitionsState.refs.push(type);

		return {
			[REF_TAG]: DEF_ROOT +
				type.name
		};
	},

	recordMapper = (definitionsState, type) => {

		const
			fieldToProperty = (properties, field) => {
				const
					mapper = definitionsState.typeMappers[field.type.typeName];

				properties[field.name] = mapper(definitionsState, field.type);
				return properties;
			},
			properties = type.fields.reduce(fieldToProperty, {});

		definitionsState.definitions.push({
			name: type.name,
			value: {
				type: OPENAPI_TYPE_OBJECT,
				required: type.fields.map(field => field.name),
				properties: properties
			}
		});
	},

	arrayMapper = (definitionsState, type, typeMappers) => {
		return {
			type: OPEN_API_TYPE_ARRAY,
			items: definitionsState.typeMappers[type.itemsType.typeName](definitionsState, type.itemsType)
		};
	},

	schemasToPaths = (paths, [name, avroSchema]) => {

		const
			recordName = avroSchema.name.split('.').pop();

		paths['/' + name] = {
			post: {
				description: `Raise a ${recordName} event.`,
				operationId: name,
				parameters: [{
					name: recordName,
					'in': 'body',
					description: avroSchema.doc,
					required: true,
					schema: {
						$ref: DEF_ROOT + avroSchema.name
					}
				}],
				responses: {
					200: {
						description: `${name} response`,
						schema: {
							type: OPENAPI_TYPE_OBJECT,
							required: ['id'],
							properties: {
								id: {
									type: OPENAPI_TYPE_STRING
								}
							}
						}
					},
					'default': {
						description: 'Error'
					}
				}
			}
		};

		return paths;

	},
	schemaToDefinitions = (definitionsState, [name, avroSchema]) => {

		recordMapper(definitionsState, avroSchema);

		while (definitionsState.refs.length > 0) {
			recordMapper(definitionsState, definitionsState.refs.pop());
		}

		return definitionsState;
	},

	typeMappers = {
		'boolean': booleanTypeMapper,
		'int': integerTypeMapper,
		'long': integerTypeMapper,
		'float': numberTypeMapper,
		'double': numberTypeMapper,
		bytes: byteTypeMapper,
		string: stringTypeMapper,
		array: arrayMapper,
		record: recordReferenceMapper
	};

/**
 * OpenAPI Generator.
 * @module
 */

module.exports = {

	/**
	 * Generate an OpenAPI 2.0 document.
	 * 
	 * @param {object} info - The document info.
	 * @param {string} info.version - The version.
	 * @param {string} info.title - The title.
	 * @param {string} info.description - The site description.
	 * @param {string} host - The host.
	 * @param {string} basePath - The base path for the api.
	 * @param {string[]} schemes - Uri schemes bob.
	 * @param {object} schemas - Map of name to schema object.
	 * @return {object} - The document.
	 */
	generateV2: (info, host, basePath, schemes, schemaNameToDefinition) => (req, res) => {

		const
			entries = Object.keys(schemaNameToDefinition).map(name => [name, schemaNameToDefinition[name]]),
			parsedSchemas = entries.map(([name, value]) => [name, avsc.Type.forSchema(value)]),
			paths = parsedSchemas.reduce(schemasToPaths, {}),
			definitionsState = parsedSchemas.reduce(schemaToDefinitions, {
				definitions: [],
				refs: [],
				typeMappers: typeMappers
			}),
			defs = definitionsState.definitions.reverse().reduce((accum, def) => {
				accum[def.name] = def.value;
				return accum;
			}, {}),
			document = {
				swagger: V2,
				info,
				host,
				basePath,
				schemes,
				consumes: [CONTENT_TYPE],
				produces: [CONTENT_TYPE],
				paths,
				definitions: defs
			};

		res.json(document);
	}

};
