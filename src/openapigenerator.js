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
	simpleTypeMapper = (definitionsState, type) => {
		return {
			type: type.typeName
		};
	},

	intTypeMapper = (definitionsState, type) => {
		return {
			type: 'integer'
		};
	},

	doubleTypeMapper = (definitionsState, type) => {
		return {
			type: 'number'
		};
	},

	recordMapper = (definitionsState, type) => {

		definitionsState.refs.push(type);

		return {
			['$ref']: '#/definitions/' +
				type.name
		};
	},

	fullRecordMapper = (definitionsState, type) => {

		const
			fieldToProperty = (properties, field) => {
				const
					mapper = definitionsState.typeMappers[field.type.typeName];

				// if (!mapper) {
				// 	throw new Error('No Mapper for ' + field.type.typeName);
				// }

				properties[field.name] = mapper(definitionsState, field.type);
				return properties;
			},
			properties = type.fields.reduce(fieldToProperty, {});

		definitionsState.definitions.push({
			name: type.name,
			value: {
				type: 'object',
				required: type.fields.map(field => field.name),
				properties: properties
			}
		});
	},

	arrayMapper = (definitionsState, type, typeMappers) => {
		return {
			type: 'array',
			items: definitionsState.typeMappers[type.itemsType.typeName](definitionsState, type.itemsType)
		};
	},

	schemaToPaths = (paths, avroSchema) => {

		const
			shortName = avroSchema.name.split('.').pop();

		paths['/' + shortName] = {
			post: {
				description: 'Raise a ' + shortName + ' event.',
				operationId: shortName,
				parameters: [{
					name: shortName,
					'in': 'body',
					description: shortName,
					required: true,
					schema: {
						$ref: '#/definitions/' + avroSchema.name
					}
				}],
				responses: {
					200: {
						description: shortName + ' response'
					},
					'default': {
						description: 'Error'
					}
				}
			}
		};

		return paths;

	},
	schemaToDefinitions = (definitionsState, avroSchema, typeMappers) => {

		fullRecordMapper(definitionsState, avroSchema);

		while (definitionsState.refs.length > 0) {
			fullRecordMapper(definitionsState, definitionsState.refs.pop());
		}

		return definitionsState;
	},

	typeMappers = {
		string: simpleTypeMapper,
		'int': intTypeMapper,
		'double': doubleTypeMapper,
		array: arrayMapper,
		record: recordMapper
	};

/**
 * Generator for OpenAPI documents.
 */
class OpenApiGenerator {

	/**
	 * Generate an OpenAPI 2.0 document.
	 * 
	 * @param {object} info - The document info.
	 * @param {string} info.version - The version.
	 * @param {string} info.title - The title.
	 * @param {object} schemas
	 * @return {object} - The document.
	 */
	generateV2(info, host, basePath, schemes, schemas) {

		const
			paths = schemas.reduce(schemaToPaths, {}),
			definitionsState = schemas.reduce(schemaToDefinitions, {
				definitions: [],
				refs: [],
				typeMappers: typeMappers
			}),
			defs = definitionsState.definitions.reverse().reduce((accum, def) => {
				accum[def.name] = def.value;
				return accum;
			}, {});

		return {
			swagger: '2.0',
			info,
			host,
			basePath,
			schemes,
			consumes: ['application/json'],
			produces: ['application/json'],
			paths,
			definitions: defs
		};

	}

}

module.exports = {
	OpenApiGenerator
};
