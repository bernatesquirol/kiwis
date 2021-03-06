'use strict';

const d3 = require('d3-array');

const Validator = require('./Validator.js');


/**
* @class
* @property {number} length The number of values in the Series
* @property {boolean} empty Whether the Series contains any value or not
*/

class Series {

	/**
	* @constructor
	* @hideconstructor
	* @param {(*[]|Series)} data An array of values or a Series
	*/
	constructor(data) {
		if (!data) {
			this._data = [];
		}
		else if (data instanceof Series) {
			this._data = data._data;
		}
		else {
			this._data = Array.from(JSON.parse(JSON.stringify(data)));
			this._data.forEach((value, index) => {
				if (value && typeof value !== 'boolean' && !Number.isNaN(+value))
					this._data[index] = +value;
			});
		}
		this._data.forEach((value, index) => {
			Object.defineProperty(this, index, {
				value: value,
				configurable: true
			});
		});
		this._kw = require('./Kiwis.js');
	}

	get length() {
		return this._data.length;
	}

	get empty() {
		return this._data.length === 0;
	}

	/**
	* Returns the Series as an array
	* @returns {*[]}
	*/
	toArray() {
		return this._data;
	}

	/**
	* Clones the Series
	* @returns {Series}
	*/
	clone() {
		return new Series(this);
	}

	/**
	* Returns any row of the Series
	* @param {number} index
	* @returns {*}
	* @example
	* // Returns the value at index 4
	* series.get(4);
	*/
	get(index) {
		Validator.integer('Series.get()', 'index', index, { range: [0, this.length - 1] });
		return this._data[index];
	}

	/**
	* Returns the first value of the Series
	* @returns {*}
	*/
	first() {
		return this._data[0];
	}

	/**
	* Returns the last value of the Series
	* @returns {*}
	*/
	last() {
		return this._data[this._data.length - 1];
	}

	/**
	* Returns a specific value in the Series
	* @param {callback} condition The returned value is the first one that matches this condition
	* @returns {*}
	* @example
	* // Returns the value that contains 'fast'
	* series.find(value => value.includes('fast'));
	*/
	find(condition) {
		Validator.function('Series.find()', 'condition', condition);

		const df = this.filter(condition);
		return !df.empty ? df.get(0) : undefined;
	}

	/**
	* Sets a value in the Series
	* @param {number} index
	* @param {*} value
	* @example
	* // Sets the 42nd value of the Series to 'Slartibartfast'
	* df.set(42, 'Slartibartfast');
	*/
	set(index, value) {
		Validator.integer('Series.set()', 'index', index, { range: [0, this.length - 1] });
		this._data[index] = value;
	}

	/**
	* Returns a new Series containing the first N values of the Series
	* @param {number} [n=5] Number of values to select
	* @returns {Series}
	* @example
	* // Returns a new Series with the first 10 values
	* series.head(10);
	*/
	head(n = 5) {
		Validator.integer('Series.head()', 'n', n);
		return this.slice(0, n);
	}

	/**
	* Returns a new Series containing the last N values of the Series
	* @param {number} [n=5] Number of values to select
	* @returns {Series}
	* @example
	* // Returns a new Series with the last 5 values
	* series.tail();
	*/
	tail(n = 5) {
		Validator.integer('Series.tail()', 'n', n);
		return this.slice(-n);
	}

	/**
	* Returns a new Series with a slice of the original values
	* @param {number} start Zero-based index at which to start extraction
	* @param {number} [end=Series.length] Zero-based index before which to end extraction
	* @returns {Series}
	* @example
	* // Returns a new Series with values starting at index 10
	* series.slice(10);
	* // Returns a new Series with values between index 24 (included) and 42 (excluded)
	* series.slice(24, 42);
	*/
	slice(start, end = this.length) {
		Validator.integer('Series.slice()', 'start', start);
		Validator.integer('Series.slice()', 'end', end);
		return new Series(this._data.slice(start, end));
	}

	/**
	* Returns the values of the Series as an iterable
	* @returns {Iterable.<*>}
	* @example
	* for (let value of series.values()) {
	*   console.log(value);
	* }
	*/
	values() {
		let index = 0;
		const data = this._data;
		return {
			next: function () {
				let value = index < data.length ? data[index] : null;
				index++;
				return {
					value: value,
					done: index > data.length
				};
			},
			[Symbol.iterator]: function () { return this; }
		};
	}

	/**
	* Returns an array of index/value pairs as an iterable
	* @returns {Iterable.<Array.<number, *>>}
	* @example
	* for (let [index, value] of series.items()) {
	*   console.log(index, value);
	* }
	*/
	items() {
		let index = 0;
		const data = this._data;
		return {
			next: function () {
				let value = index < data.length ? [index, data[index]] : null;
				index++;
				return {
					value: value,
					done: index > data.length
				};

			},
			[Symbol.iterator]: function () { return this; }
		};
	}

	/**
	* Applies a callback function to each value of the Series
	* @param {callback} callback
	* @example
	* // Displays each value of the Series
	* series.forEach(value => console.log(value));
	*/
	forEach(callback) {
		Validator.function('Series.forEach()', 'callback', callback);
		this._data.forEach(callback);
	}

	/**
	* Returns a new Series populated with the results of a callback function applied on the Series
	* @param {callback} callback
	* @returns {Series}
	* @example
	* // Double each value in the Series
	* series.map(value => value * 2);
	*/
	map(callback) {
		Validator.function('Series.map()', 'callback', callback);
		return new Series(this._data.map(callback));
	}

	/**
	* Appends new values to a Series
	* @param {Object|Object[]} values Value or array of values to append to the Series
	* @returns {Series}
	* @example
	* series.append([42, 101]);
	*/
	append(values) {
		const data = Array.isArray(values) ? values : [values];
		this._data = [...this._data, ...data];
		return this;
	}

	/**
	* Inserts new values into a Series
	* @param {*|*[]} values Value or array of values to insert into the Series
	* @param {number} [index=0] Index to insert the values at
	* @returns {Series}
	* @example
	* // Inserts value 42 at index 2 in the Series
	* series.insert(42, 2);
	*/
	insert(values, index = 0) {
		Validator.integer('Series.insert()', 'index', index, { range: [0, this.length - 1] });

		const data = Array.isArray(values) ? values : [values];
		this._data.splice(index, 0, ...data);
		return this;
	}

	/**
	* Concats another Series to the Series
	* @param {Series} other
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Concatenates series1 and series2
	* series1.concat(series2, { inPlace: true });
	*/
	concat(other, options = {}) {
		Validator.instanceOf('Series.concat()', 'other', other, 'Series', Series);
		Validator.options('Series.concat()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		return this.append(other.toArray(), options);
	}

	/**
	* Drops N/A values from the Series
	* @param {Object} [options]
	* @param {*[]} [options.keep=[0, false]] Array of falsy values to keep in the Series
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Drop all N/A values from the Series
	* series.dropNA({ inPlace: true });
	* // Drop all N/A values but keep empty strings
	* series.dropNA({ keep: [''], inPlace: true });
	*/
	dropNA(options = {}) {
		Validator.options('Series.dropNA()', options, [
			{ key: 'keep', type: '*[]' },
			{ key: 'inPlace', type: 'boolean' }
		]);

		const keep = options.keep || [0, false];

		return this.filter(value => Boolean(value) || keep.includes(value));
	}

	/**
	* Drops duplicate values from the Series
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* series.dropDuplicates({ inPlace: true });
	*/
	dropDuplicates(options = {}) {
		Validator.options('Series.dropDuplicates()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		const inPlace = options.inPlace || false;

		if (inPlace) {
			this._data = [...new Set(this._data)];
			return this;
		}
		const s = this.clone();
		s._data = [...new Set(s._data)];
		return s;
	}

	/**
	* Returns true if any value of the series satisfies the given condition
	* @param {callback} [condition=!Kiwis.isNA]
	* @returns {boolean}
	* @example
	* // Returns true if any value is not N/A
	* series.any();
	*
	* // Returns true if any value is greater than 42
	* series.any(value => value > 42);
	*/
	any(condition = value => !this._kw.isNA(value)) {
		Validator.function('Series.any()', 'condition', condition);
		return this._data.some(condition);
	}

	/**
	* Returns true if all values of the series satisfy the given condition
	* @param {callback} [condition=!Kiwis.isNA]
	* @returns {boolean}
	* @example
	* // Returns true if all values are not N/A
	* series.all();
	*
	* // Returns true if all values are greater than 42
	* series.all(value => value > 42);
	*/
	all(condition = value => !this._kw.isNA(value)) {
		Validator.function('Series.all()', 'condition', condition);
		return this._data.every(condition);
	}

	/**
	* Filters values of the Series
	* @param {callback} filter Callback to apply
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Only keeps values greater than 42
	* series.filter(value => value > 42, { inPlace: true });
	*/
	filter(filter, options = {}) {
		Validator.function('Series.filter()', 'filter', filter);
		Validator.options('Series.filter()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		const inPlace = options.inPlace || false;

		const filteredData = this._data.filter(filter);
		if (inPlace) {
			this._data = filteredData;
			return this;
		}
		return new Series(filteredData);
	}

	/**
	* Drops values from the Series
	* @param {callback} filter Callback to apply
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Only drops values greater than 42
	* series.drop(value => value > 42, { inPlace: true });
	*/
	drop(filter, options = {}) {
		Validator.function('Series.drop()', 'filter', filter);
		Validator.options('Series.drop()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		return this.filter(e => !filter(e), options);
	}

	/**
	* Sorts the Series
	* @param {Object} [options]
	* @param {boolean} [options.reverse=false] Sorts the Series in descending order
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Sorts the Series in descending order
	* series.sort({ reverse: true, inPlace: true });
	*/
	sort(options = {}) {
		Validator.options('Series.sort()', options, [
			{ key: 'reverse', type: 'boolean' },
			{ key: 'inPlace', type: 'boolean' }
		]);

		const reverse = options.reverse || false;
		const inPlace = options.inPlace || false;

		const sortedData = [...this._data].sort((a, b) => {
			return reverse ? b - a : a - b;
		});
		if (inPlace) {
			this._data = sortedData;
			return this;
		}
		return new Series(sortedData);
	}

	/**
	* Shuffles the values of a Series
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* series.shuffle({ inPlace: true });
	*/
	shuffle(options = {}) {
		Validator.options('Series.shuffle()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		const inPlace = options.inPlace || false;

		if (inPlace) {
			this._data.sort(() => Math.random() - 0.5);
			return this;
		}
		const s = this.clone();
		s._data.sort(() => Math.random() - 0.5);
		return s;
	}

	/**
	* Returns the unique values in the Series as an array
	* @returns {*[]}
	*/
	unique() {
		return [...new Set(this._data)];
	}

	/**
	* Returns the number of occurrences for each value in the Series
	* @param {Object} [options]
	* @param {boolean} [options.sort=true] Sorts the counts
	* @param {boolean} [options.reverse=true] Sorts the counts in descending order
	* @returns {[*, number][]} Counts as an array of of value/count pairs
	* @example
	* // Returns the number of occurrences for each value in the Series, in ascending order
	* series.counts({ reverse: false });
	*/
	counts(options = {}) {
		Validator.options('Series.counts()', options, [
			{ key: 'sort', type: 'boolean' },
			{ key: 'reverse', type: 'boolean' }
		]);

		const sort = options.sort !== undefined ? options.sort : true;
		const reverse = options.reverse !== undefined ? options.reverse : true;

		const counts = this._data.reduce((acc, value) => {
			if (value in acc) {
				acc[value]++;
				return acc;
			}
			return {
				...acc,
				[value]: 1
			};
		}, {});
		if (sort) {
			return Object.entries(counts)
				.sort((a, b) => reverse ? b[1] - a[1] : a[1] - b[1]);
		}
		return Object.entries(counts);
	}

	/**
	* Returns the frequency for each value in the Series
	* @param {Object} [options]
	* @param {boolean} [options.sort=true] Sorts the frequencies
	* @param {boolean} [options.reverse=true] Sorts the frequencies in descending order
	* @returns {[*, number][]} Counts as an array of value/frequency pairs
	* @example
	* // Returns the frequency for each value in the Series, in ascending order
	* series.frequencies({ reverse: false });
	*/
	frequencies(options = {}) {
		Validator.options('Series.frequencies()', options, [
			{ key: 'sort', type: 'boolean' },
			{ key: 'reverse', type: 'boolean' }
		]);
		return this.counts(options).map(([value, count]) => [value, count / this.length]);
	}

	/**
	* Round the values in the Series
	* @param {number} [digits=0] Number of digits for rounding
	* @param {Object} [options]
	* @param {boolean} [options.inPlace=false] Changes the current Series instead of returning a new one
	* @returns {Series}
	* @example
	* // Rounds all values in the digits to 2 decimal points
	* series.round(2, { inPlace: true });
	*
	* // Truncates all values in the Series
	* series.round(0, { inPlace: true });
	*/
	round(digits = 0, options = {}) {
		Validator.integer('Series.round()', 'digits', digits);
		Validator.options('Series.round()', options, [
			{ key: 'inPlace', type: 'boolean' }
		]);

		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.round(): cannot round non-number values');
		const inPlace = options.inPlace || false;
		if (inPlace) {
			this._data = this._data.map(value => (+value).toFixed(digits));
			return this;
		}
		return new Series(this._data.map(value => (+value).toFixed(digits)));
	}

	/**
	* Returns a single reduced value after applying the given callback to the values of the Series
	* @param {callback} callback
	* @param {*} [initial=Series.first()] Value to use as the first argument to the first call of the callback
	* @returns {*}
	* @example
	* // Returns the sum of all values in the Series
	* series.reduce((acc, value) => acc + value); // Equivalent to series.sum()
	*
	* // Returns the product of all values in the Series
	* series.reduce((acc, value) => acc * value, 1);
	*/
	reduce(callback, initial) {
		Validator.function('Series.reduce()', 'callback', callback);

		if (initial)
			return this._data.reduce(callback, initial);
		return this._data.reduce(callback);
	}

	/**
	* Returns the sum of the values in the Series
	* @returns {number}
	*/
	sum() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.sum(): cannot sum non-number values');
		return d3.sum(this._data, d => +d);
	}

	/**
	* Returns the minimum value in the Series
	* @returns {number}
	*/
	min() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.min(): cannot compute non-number values');
		return d3.min(this._data, d => +d);
	}

	/**
	* Returns the maximum value in the Series
	* @returns {number}
	*/
	max() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.max(): cannot compute non-number values');
		return d3.max(this._data, d => +d);
	}

	/**
	* Returns the extent of the Series
	* @returns {[number, number]}
	*/
	extent() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.extent(): cannot compute non-number values');
		return d3.extent(this._data, d => +d);
	}

	/**
	* Returns the mean of the values in the Series
	* @returns {number}
	*/
	mean() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.mean(): cannot average non-number values');
		return d3.mean(this._data, d => +d);
	}

	/**
	* Returns the median of the values in the Series
	* @returns {number}
	*/
	median() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.median(): cannot compute non-number values');
		return d3.median(this._data, d => +d);
	}

	/**
	* Returns the standard deviation of the values in the Series
	* @returns {number}
	*/
	std() {
		if (this.any(value => Number.isNaN(+value)))
			throw new Error('Error in Series.std(): cannot compute non-number values');
		return d3.deviation(this._data, d => +d);
	}

	/**
	* Formats the Series for display
	* @returns {string}
	*/
	toString() {
		if (this.empty) {
			return 'Empty Series';
		}

		const MAX_WIDTH = 42;
		const MAX_LENGTH = 25;

		const widths = [
			Math.min(MAX_LENGTH.toString().length, this.length.toString().length),
			Math.min(MAX_WIDTH, d3.max(this._data, d => d && d.toString().length))
		];

		const lines = [];
		this._data
			.slice(0, MAX_LENGTH)
			.map(value => !this._kw.isNA(value) ? value.toString() : 'N/A')
			.forEach((value, index) => {
				const line = [
					index.toString().padEnd(widths[0]),
					value.length > MAX_WIDTH
						? `${value.substr(0, MAX_WIDTH - 3)}...`
						: value.padStart(widths[1])
				].join(' | ');
				lines.push(line);
			});
		if (this.length > MAX_LENGTH) lines.push('...');
		lines.push('');
		lines.push(`Length: ${this.length}`);
		return lines.join('\n');
	}

	/**
	* Displays the Series
	*/
	show() {
		console.log(this.toString());
		console.log();
	}

	/**
	* Exports the Series as CSV
	* @param {string} [path=null] Path of the file to save
	* @param {Object} [options]
	* @param {string} [options.name='series'] Column name to use
	* @returns {string|undefined} A JSON string if `path` is not set
	* @example
	* series.toCSV('myAwesomeData.csv', { name: 'awesome' });
	*/
	toCSV(path, options = {}) {
		Validator.options('Series.toCSV()', options, [
			{ key: 'name', type: 'string' }
		]);

		const name = options.name || 'series';

		let content = [name, ...this._data].join('\n');
		if (!path) return content;
		eval('require')('fs').writeFileSync(path, content);
	}

	/**
	* Exports the Series as a JSON file
	* @param {string} [path=null] Path of the file to save
	* @param {Object} [options]
	* @param {string} [options.name='series'] Column name to use
	* @param {boolean} [options.prettify=true] Prettify JSON output
	* @returns {string|undefined} A JSON string if `path` is not set
	* @example
	* series.toJSON('myAwesomeData.json', { name: 'awesome' });
	*/
	toJSON(path, options = {}) {
		Validator.options('Series.toJSON()', options, [
			{ key: 'name', type: 'string' },
			{ key: 'prettify', type: 'boolean' }
		]);

		const prettify = options.prettify !== undefined ? options.prettify : true;
		const name = options.name || 'series';

		const content = JSON.stringify({ [name]: this._data }, null, prettify ? '\t' : null);
		if (!path) return content;
		eval('require')('fs').writeFileSync(path, content);
	}

}

module.exports = Series;
