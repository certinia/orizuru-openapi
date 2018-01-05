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

	_ = require('lodash'),
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

	RESPONSE_RECORD_NAME = 'Response',

	getRecordName = (fullyQualifiedName) => {
		return fullyQualifiedName.split('.').pop();
	},

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

		const
			recordName = getRecordName(type.name);

		definitionsState.refs.push(type);

		return {
			[REF_TAG]: DEF_ROOT +
				recordName
		};
	},

	recordMapper = (definitionsState, type) => {

		const
			recordName = getRecordName(type.name),
			fieldToProperty = (properties, field) => {
				const
					mapper = definitionsState.typeMappers[field.type.typeName];

				properties[field.name] = mapper(definitionsState, field.type);
				return properties;
			},
			properties = type.fields.reduce(fieldToProperty, {}),
			definition = {
				type: OPENAPI_TYPE_OBJECT,
				properties: properties
			},
			required = {
				required: type.fields.map(field => field.name)
			};

		definitionsState.definitions.push({
			name: recordName,
			value: Object.assign(definition, type.fields.length ? required : {})
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
			recordName = getRecordName(avroSchema.name);

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
						$ref: DEF_ROOT + recordName
					}
				}],
				responses: {
					200: {
						description: `${name} response`,
						schema: {
							$ref: DEF_ROOT + RESPONSE_RECORD_NAME
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

		const
			responseSchema = avsc.Type.forSchema({
				name: RESPONSE_RECORD_NAME,
				doc: RESPONSE_RECORD_NAME,
				type: 'record',
				fields: [{
					name: 'id',
					type: 'string'
				}]
			}),
			recordName = getRecordName(avroSchema.name);

		if (recordName === RESPONSE_RECORD_NAME) {
			throw new Error(`Schema record name clashes with the generated response record name ${RESPONSE_RECORD_NAME}`);
		}

		recordMapper(definitionsState, avroSchema);

		while (definitionsState.refs.length > 0) {
			recordMapper(definitionsState, definitionsState.refs.pop());
		}

		recordMapper(definitionsState, responseSchema);

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
	 * An express request handler.
	 * @typedef RequestHandler
	 * @type {function}
	 * @param {Object} req - The request.
	 * @param {Object} res - The response.
	 */

	/**
	 * Returns an express RequestHandler function that will send an OpenAPI 2.0 document
	 * as a JSON response. The template is merged with the paths and definitions
	 * generated from the Avro schema map.
	 * A generated response definition is created with the name 'Response' this must
	 * not clash with any schemas passed in.
	 *
	 * @param {Object} template - The OpenAPI 2.0 template.
	 * @param {Object} schemaNameToDefinition - Map of name to Avro schema JSON object.
	 * @returns {RequestHandler} - The handler.
	 */
	generateV2: (template, schemaNameToDefinition) => (req, res) => {

		const
			entries = Object.keys(schemaNameToDefinition).map(name => [name, schemaNameToDefinition[name]]),
			parsedSchemas = entries.map(([name, value]) => [name, avsc.Type.forSchema(value)]),
			paths = parsedSchemas.reduce(schemasToPaths, {}),
			definitionsState = parsedSchemas.reduce(schemaToDefinitions, {
				definitions: [],
				refs: [],
				typeMappers: typeMappers
			}),
			// Reverse the order so dependencies come before dependants.
			defs = definitionsState.definitions.reverse().reduce((accum, def) => {
				accum[def.name] = def.value;
				return accum;
			}, {}),
			document = _.merge({}, {
				swagger: V2,
				info: {},
				host: '',
				basePath: '',
				schemes: ['https'],
				consumes: [CONTENT_TYPE],
				produces: [CONTENT_TYPE],
				paths,
				definitions: defs
			}, template);

		res.json(document);
	}

};
