[![Build Status](https://travis-ci.org/advanced-rest-client/date-time.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/date-time)

## DateTime component
Tag: `<date-time>`

### Installation
Using bower:
```
bower install --save advanced-rest-client/date-time
```

`<date-time>` An element to display formatted date and time.

The `date` propery accepts Date object, Number as a timestamp or string that
will be parsed to the Date object.

This element uses the `Intl` interface which is available in IE 11+ browsers.
It will throw an error in IE 10 unless you'll provide a polyfill for the `Intl`.

To format the date use [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) inteface options.

The default value for each date-time component property is undefined, but if all component properties are undefined, then year, month, and day are assumed to be "numeric".

### Example
```
<date-time date="2010-12-10T11:50:45Z" year="numeric" month="narrow" day="numeric"></date-time>
```

The element provides accessibility by using the `time` element and setting the `datetime` attribute on it.

### Styling
`<date-time>` provides the following custom properties and mixins for styling:

Custom property | Description | Default
----------------|-------------|----------
`--date-time` | Mixin applied to the element | `{}`

## API
### Component properties (attributes)

#### locales
- Type: `string`
A string with a BCP 47 language tag, or an array of such strings.
For the general form and interpretation of the locales argument,
see the Intl page.
The following Unicode extension keys are allowed:
- nu - Numbering system. Possible values include: "arab", "arabext",
"bali", "beng", "deva", "fullwide", "gujr", "guru", "hanidec", "khmr",
"knda", "laoo", "latn", "limb", "mlym", "mong", "mymr", "orya",
"tamldec", "telu", "thai", "tibt".
- ca - Calendar. Possible values include: "buddhist", "chinese",
"coptic", "ethioaa", "ethiopic", "gregory", "hebrew", "indian",
"islamic", "islamicc", "iso8601", "japanese", "persian", "roc".

#### date
- Type: `Date`
A date object to display

#### display
- Type: `string`
A string to display

#### year
- Type: `string`
The representation of the year.
Possible values are "numeric", "2-digit".

#### month
- Type: `string`
The representation of the month.
Possible values are "numeric", "2-digit", "narrow", "short", "long".

#### day
- Type: `string`
The representation of the day.
Possible values are "numeric", "2-digit".

#### hour
- Type: `string`
The representation of the hour.
Possible values are "numeric", "2-digit".

#### minute
- Type: `string`
The representation of the minute.
Possible values are "numeric", "2-digit".

#### second
- Type: `string`
The representation of the second.
Possible values are "numeric", "2-digit".

#### weekday
- Type: `string`
The representation of the weekday.
Possible values are "narrow", "short", "long".

#### timeZoneName
- Type: `string`
The representation of the time zone name. Possible values are
"short", "long".

#### era
- Type: `string`
The representation of the era. Possible values are "narrow",
"short", "long".

#### timeZone
- Type: `string`
The time zone to use. The only value implementations must recognize
is "UTC"; the default is the runtime's default time zone.
Implementations may also recognize the time zone names of the IANA
time zone database, such as "Asia/Shanghai", "Asia/Kolkata",
"America/New_York".

#### hour12
- Type: `boolean`
Whether to use 12-hour time (as opposed to 24-hour time).
Possible values are `true` and `false`; the default is locale
dependent.

#### iso
- Type: `string`
- Read only property
An ISO string to attach to the `<time>` element.

#### isReady
- Type: `boolean`
True when the element is ready.


### Component methods


