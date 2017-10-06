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
	{ OpenApiGenerator } = require('../src/openapigenerator'),
	{ expect } = require('chai');

describe('openapigenerator.js', () => {

	describe('OpenApiGenerator', () => {

		it('generate a valid document for no schemas', () => {

			// given
			const
				generator = new OpenApiGenerator(),
				schemas = [],
				doc = generator.generateV2({
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				}, 'test.com', '/api', ['http'], schemas);

			// then
			expect(doc).to.deep.eql({
				swagger: '2.0',
				info: {
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				},
				host: 'test.com',
				basePath: '/api',
				schemes: [
					'http'
				],
				consumes: ['application/json'],
				produces: ['application/json'],
				paths: {},
				definitions: {}
			});

		});

		it('generate a valid path for a single schema', () => {

			// given
			const
				generator = new OpenApiGenerator(),
				testAvroSchema = avsc.Type.forSchema(require('./resources/test')),
				schemas = [testAvroSchema],
				doc = generator.generateV2({
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				}, 'test.com', '/api', ['http'], schemas);

			// then
			expect(doc).to.deep.eql({
				swagger: '2.0',
				info: {
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				},
				host: 'test.com',
				basePath: '/api',
				schemes: [
					'http'
				],
				consumes: ['application/json'],
				produces: ['application/json'],
				paths: {
					'/Question': {
						post: {
							description: 'Raise a Question event.',
							operationId: 'Question',
							parameters: [{
								name: 'Question',
								'in': 'body',
								description: 'Question',
								required: true,
								schema: {
									$ref: '#/definitions/com.ffdc.orizuru.problem.avro.Question'
								}
							}],
							responses: {
								200: {
									description: 'Question response'
								},
								'default': {
									description: 'Error'
								}
							}
						}
					}
				},
				definitions: {
					'com.ffdc.orizuru.problem.avro.Location': {
						type: 'object',
						required: ['lat', 'lng'],
						properties: {
							lat: {
								type: 'number'
							},
							lng: {
								type: 'number'
							}
						}
					},
					'com.ffdc.orizuru.problem.avro.Delivery': {
						type: 'object',
						required: ['id', 'type', 'capacity', 'location'],
						properties: {
							id: {
								type: 'string'
							},
							type: {
								type: 'string'
							},
							capacity: {
								type: 'integer'
							},
							location: {
								$ref: '#/definitions/com.ffdc.orizuru.problem.avro.Location'
							}
						}
					},
					'com.ffdc.orizuru.problem.avro.Question': {
						type: 'object',
						required: ['id', 'deliveries'],
						properties: {
							deliveries: {
								type: 'array',
								items: {
									$ref: '#/definitions/com.ffdc.orizuru.problem.avro.Delivery'
								}
							},
							id: {
								type: 'string'
							}
						}
					}
				}
			});
		});
	});
});
