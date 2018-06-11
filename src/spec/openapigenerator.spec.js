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
	generateV2 = require('../lib/openapigenerator').generateV2,
	{ calledOnce, calledWith } = sinon.assert,
	{ expect } = require('chai');

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

		sinon.stub(res, 'json');
	});

	afterEach(() => {
		sinon.reset();
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
			calledWith(res.json, require('../res/spec/swagger/none'));

		});

		it('generate a valid path for a single schema', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('../res/spec/avro/single')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, require('../res/spec/swagger/single'));
		});

		it('generate a valid document for all AVRO types', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('../res/spec/avro/types')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, require('../res/spec/swagger/types'));

		});

		it('generate a valid document when a record has no fields', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('../res/spec/avro/nofields')
				},
				handler = generateV2(template, schemaMap);

			// when

			handler(req, res);

			// then

			calledOnce(res.json);
			calledWith(res.json, require('../res/spec/swagger/nofields'));

		});

		it('generate an error if a schema is named Response', () => {

			// given
			const
				schemaMap = {
					TestRoute: require('../res/spec/avro/response')
				},
				handler = generateV2(template, schemaMap);

			// when - then

			expect(() => handler({}, {})).to.throw('Schema record name clashes with the generated response record name Response');

		});

	});
});
