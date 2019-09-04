[![Build Status](https://travis-ci.org/advanced-rest-client/bytes-counter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/bytes-counter)

## BytesCounter component
Tag: `<bytes-counter>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/bytes-counter
```

An element that computes number of bytes in `String`, `ArrayBuffer`, `Blob`
(and therefore `File`) and in supported browsers `FormData`.

Note that Safari is excluded from FormData tests because there's some bug in
WebKit iplementation of the Request object and it doesn't read FormData
properly. Chrome had similar bug but they fixed it already. See demo page
to check if your browser support FormData.

### Example
```
<textarea value="{{value::input}}"></textarea>
<bytes-counter value="[[value]]" bytes="{{bytes}}"></bytes-counter>
```

In the example above the `bytes` variable contains size of the input.

Note that computations are synchronous and there is a delay between setting the
`value` property (or calling `calculate()` function) and getting a result.

## New in version 2

- It does not include polyfills. Include polyfills library if you targeting
older browsers. Polyfill required for fetch API to support FormData.

## API
### Component properties (attributes)

#### value
- Type: `string`
A value to be evaluated.
It can be text, blob (and therefore File), ArrayBuffer or FormData

#### bytes
- Type: `number`
- Read only property
Calculated number of bytes from the `value`


### Component methods

#### calculate
- Return type: `Promise.<Number>`
Calculates number of bytes in the `value`.

After computation it sets `bytes` property of the element.

This function returns Promise but you may want to use synchronous versions
for values that contains a method to read size synchronously. Not all
values can be processed synchronously (FormData for example).
#### stringBytes
- Return type: `Number`
Calculates number of bytes in string.

See: http://stackoverflow.com/a/23329386/1127848
#### blobBytes
- Return type: `Number`
Calculates number of bytes in Blob (and therefore in File).
#### bufferBytes
- Return type: `Number`
Calculates number of bytes in ArrayBuffer.

Note, it is only possible to read number of allocated bytes by the buffer,
even if they are not containig any value. It is a size of the buffer at
the time it was created.

