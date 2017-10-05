'use strict';

const
	index = require('../src/index'),

	chai = require('chai'),
	expect = chai.expect;

describe('index', () => {

	describe('exports', () => {

		it('exports nothing.', () => {

			expect(index).to.not.eql(undefined);

		});

	});

});
