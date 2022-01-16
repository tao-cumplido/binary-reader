# Enums for JavaScript

> Simple enum implementation for JavaScript.

[![NPM Version][npm-image]][npm-url]

## Install

```sh
npm install @nishin/enum
```

## Usage

`Enum` is a class factory that takes a symbol. Instances of the class need to be instantiated with the same symbol. This makes it possible to prevent instantiation outside of the module if the symbol is not exported.

Enum instances have an implicit `index` property that starts at 0 and auto increments. The index can be specified explicitly in the constructor for individual instances. Implicit indexes keep auto incrementing from the last index that was explicitly specified. No two instances can have the same index and the constructor will throw an error in this case.

```js
import { Enum } from '@nishin/enum';

const id = Symbol('Color');

export class Color extends Enum(id) {
	static Red = new Color(id);
	static Green = new Color(id);
	static Blue = new Color(id, { index: 10 });
}

console.log(Color.lookupIndex(0) === Color.Red); // true
console.log(Color.Green.index === 1); // true
console.log(Color.Blue.index === 10); // true
```

Additionally, enum instances can be backed by a value which has no type restrictions. Currently, values must be unique as well.

```js
import { Enum } from '@nishin/enum';

const id = Symbol('BackedColor');

export class BackedColor extends Enum(id) {
	static Red = new BackedColor(id, { value: '#ff0000'});
	static Green = new BackedColor(id, { value: '#00ff00' });
	static Blue = new BackedColor(id, { value: '#0000ff' });
}

console.log(BackedColor.lookupValue('#ff0000') === BackedColor.Red); // true
console.log(BackedColor.Green.value === '#00ff00'); // true
```

Like any JavaScript class, enums can define properties and methods.

## TypeScript

In TypeScript the `Enum` factory can take two generic type arguments: a string literal type to make the enum nominally type safe and a type for the `value` property.

```ts
import { Enum } from '@nishin/enum';

const idA = Symbol('A');
const idB = Symbol('B');

class A extends Enum<'A', boolean>(idA) {
	static readonly a = new A(idA, { value: true });
}

class B extends Enum<'B', boolean> {
	static readonly b = new B(idB, { value: false });
}

declare function test(a: A): void;

test(B.b) // error
```

[npm-image]: https://img.shields.io/npm/v/@nishin/enum.svg
[npm-url]: https://npmjs.org/package/@nishin/enum
