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
	sinon = require('sinon'),
	sandbox = sinon.sandbox.create(),
	generateV2 = require('../src/openapigenerator').generateV2,
	{ calledOnce, calledWith } = sinon.assert;

describe('openapigenerator.js', () => {

	let
		req, res, template;

	beforeEach(() => {
		req = {};
		res = { json: _.noop };
		template = {
			info: {
				version: '1.0.0',
				title: 'Test',
				description: 'Desc'
			},
			host: 'test.com',
			basePath: '/api'
		};

		sandbox.stub(res, 'json');
	});

	afterEach(() => {
		sandbox.reset();
	});

	describe('generateV2', () => {

		it('generate a valid document for no schemas', () => {

			// given
			const
				schemaMap = {},
				handler = generateV2(_.merge(template, { schemes: ['http'] }), schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, {
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
				schemaMap = {
					TestRoute: require('./resources/test')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, {
				swagger: '2.0',
				info: {
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				},
				host: 'test.com',
				basePath: '/api',
				schemes: [
					'https'
				],
				consumes: ['application/json'],
				produces: ['application/json'],
				paths: {
					'/TestRoute': {
						post: {
							description: 'Raise a Question event.',
							operationId: 'TestRoute',
							parameters: [{
								name: 'Question',
								'in': 'body',
								description: 'A question to ask.',
								required: true,
								schema: {
									$ref: '#/definitions/Question'
								}
							}],
							responses: {
								200: {
									description: 'TestRoute response',
									schema: {
										$ref: '#/definitions/Response'
									}
								},
								'default': {
									description: 'Error'
								}
							}
						}
					}
				},
				definitions: {
					Location: {
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
					Delivery: {
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
								$ref: '#/definitions/Location'
							}
						}
					},
					Question: {
						type: 'object',
						required: ['id', 'deliveries'],
						properties: {
							deliveries: {
								type: 'array',
								items: {
									$ref: '#/definitions/Delivery'
								}
							},
							id: {
								type: 'string'
							}
						}
					},
					Response: {
						properties: { id: { type: 'string' } },
						required: ['id'],
						type: 'object'
					}
				}
			});
		});

		it('generate a valid document for all AVRO types', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('./resources/types')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, {
				swagger: '2.0',
				info: {
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				},
				host: 'test.com',
				basePath: '/api',
				schemes: [
					'https'
				],
				consumes: ['application/json'],
				produces: ['application/json'],
				paths: {
					'/TestRoute': {
						post: {
							description: 'Raise a Test event.',
							operationId: 'TestRoute',
							parameters: [{
								name: 'Test',
								'in': 'body',
								description: 'Test.',
								required: true,
								schema: {
									$ref: '#/definitions/Test'
								}
							}],
							responses: {
								200: {
									description: 'TestRoute response',
									schema: {
										$ref: '#/definitions/Response'
									}
								},
								'default': {
									description: 'Error'
								}
							}
						}
					}
				},
				definitions: {
					Test: {
						type: 'object',
						required: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
						properties: {
							a: {
								type: 'boolean'
							},
							b: {
								type: 'integer'
							},
							c: {
								type: 'integer'
							},
							d: {
								type: 'number'
							},
							e: {
								type: 'number'
							},
							f: {
								type: 'byte'
							},
							g: {
								type: 'string'
							}
						}
					},
					Response: {
						properties: { id: { type: 'string' } },
						required: ['id'],
						type: 'object'
					}
				}
			});

		});

		it('generate a valid document when a record has no fields', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('./resources/nofields')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, {
				swagger: '2.0',
				info: {
					version: '1.0.0',
					title: 'Test',
					description: 'Desc'
				},
				host: 'test.com',
				basePath: '/api',
				schemes: [
					'https'
				],
				consumes: ['application/json'],
				produces: ['application/json'],
				paths: {
					'/TestRoute': {
						post: {
							description: 'Raise a NoFields event.',
							operationId: 'TestRoute',
							parameters: [{
								name: 'NoFields',
								'in': 'body',
								description: 'Test.',
								required: true,
								schema: {
									$ref: '#/definitions/NoFields'
								}
							}],
							responses: {
								200: {
									description: 'TestRoute response',
									schema: {
										$ref: '#/definitions/Response'
									}
								},
								'default': {
									description: 'Error'
								}
							}
						}
					}
				},
				definitions: {
					NoFields: {
						type: 'object',
						properties: {}
					},
					Response: {
						properties: { id: { type: 'string' } },
						required: ['id'],
						type: 'object'
					}
				}
			});

		});

	});
});
