# Enums for JavaScript

> Simple enum implementation for JavaScript.

[![NPM Version][npm-image]][npm-url]

## Install

```sh
npm install @nishin/enum
```

## Usage

`Enum` is a class factory that takes a symbol and produces a class constructor that is bound to that symbol. The generated constructor expects the same symbol passed on instantiation. This makes it possible to prevent instantiation of the class outside of the module when the symbol is not exported. The examples below demonstrate this pattern.

Enum instances have an implicit `index` property that starts at 0 and auto increments. The index can be specified explicitly in the constructor for individual instances. Implicit indexes keep auto incrementing from the last index that was explicitly specified. No two instances can have the same index and the constructor will throw an error in this case. Enum instances also have an implicit `name` property that is set to the name of the assigned identifier. The `name` property should be explicitly set if its value should be reliable on runtime, especially if the code is minified.

```js
import assert from 'node:assert';

import { Enum } from '@nishin/enum';

const id = Symbol('Color');

export class Color extends Enum(id) {
	static Red = new Color(id);
	static Green = new Color(id, { index: 10 });
	static Blue = new Color(id, { name: 'Blue' });
}

assert.equal(Color.lookupIndex(0), Color.Red);
assert.equal(Color.Green.index, 10);
assert.equal(Color.Blue.index, 11);
assert.equal(Color.Green.name, 'Green'); // probably fails with minified code
assert.equal(Color.Blue.name, 'Blue'); // always passes, name was explicitly set
```

Additionally, enum instances can be backed by a value which has no type restrictions. Currently, values must be unique as well.

```js
import assert from 'node:assert';

import { Enum } from '@nishin/enum';

const id = Symbol('CSSColor');

export class CSSColor extends Enum(id) {
	static Red = new CSSColor(id, { value: '#ff0000'});
	static Green = new CSSColor(id, { value: '#00ff00' });
	static Blue = new CSSColor(id, { value: '#0000ff' });
}

assert.equal(CSSColor.lookupValue('#ff0000'), CSSColor.Red);
assert.equal(CSSColor.Green.value, '#00ff00');
```

Like any JavaScript class, enums can define properties and methods.

## TypeScript

This library should work with TypeScript ≥ 3.8.

In TypeScript the `Enum` factory takes two generic type arguments: a string literal type to make the enum nominally type safe and an optional type for the `value` property (defaults to `unknown`).

```ts
import { Enum } from '@nishin/enum';

const idA = Symbol('A');
const idB = Symbol('B');

class A extends Enum<'A', boolean>(idA) {
	static readonly a = new A(idA, { value: true });
}

class B extends Enum<'B', boolean>(idB) {
	static readonly b = new B(idB, { value: false });
}

declare function test(a: A): void;

test(B.b);
// Argument of type 'B' is not assignable to parameter of type 'A'.
//   Types of property '#brand' are incompatible.
//     Type '"B"' is not assignable to type '"A"'.
```

Using `void` as the value type results in instances having no `value` property and the class having no static `lookupValue` method.

```ts
import { Enum } from '@nishin/enum';

const id = Symbol();

class A extends Enum<'A', void>(id) {
	static readonly a = new A(id, { value: null }); // Argument of type '{ value: null; }' is not assignable to parameter of type 'EnumFields'. Object literal may only specify known properties, and 'value' does not exist in type 'EnumFields'.
}

A.a.value; // Property 'value' does not exist on type 'A'.

A.lookupValue; // Property 'lookupValue' does not exist on type 'typeof A'.
```

[npm-image]: https://img.shields.io/npm/v/@nishin/enum.svg
[npm-url]: https://npmjs.org/package/@nishin/enum
