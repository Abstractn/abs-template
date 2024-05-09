# Abs-Template

[![npm version](https://badgen.net/npm/v/abs-template)](https://www.npmjs.com/package/abs-template) [![Install size](https://packagephobia.com/badge?p=abs-template)](https://packagephobia.com/result?p=abs-template)


## Introduction:

This module offers a static class that can preprocess HTML `<template>` nodes and print them in a somewhat dynamic way following an object with data inside it.


## CDN:

Typescript:
```https://abstractn.github.io/lib/abs-template.ts```

Javascript (with export):
```https://abstractn.github.io/lib/abs-template.js```

Javascript (without export):
```https://abstractn.github.io/lib/abs-template.nx.js```

Browser iclusion:
```<script src="https://abstractn.github.io/lib/abs-template.nx.js"></script>```


## The Config object

There are two main methods to use from this class: the first one would be `.build()`.
This method takes a config object with all the necessary parameters inside it.
Here's a deep example:

```typescript
AbsTemplate.build({
  // node reference to the template to build
  templateNode: document.querySelector('template#my-template'),

  // a data object to compile the template with
  templateData: {
    myField: 'lorem ipsum'
  },

  // the output node to where the compiled template needs to be printed
  printTargetNode: document.querySelector('.dynamic-template-container'),

  // the position relative to `printTargetNode`
  printMethod: AbsTemplatePrintMethod.BEFORE_END,
})
```

> NOTE on `printMethod`:
> I've created a custom enum to group all possible values but not that these are in reality the same ones used by the native method `Element.insertAdjacentElement()`
> (see [MDN's documentation here](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement) for more details)

Underneath `build()`'s logic there's `compile()`: if you need to just parse your template node and get the result without printing it immediately this will return the compiled HTML as a string.



## Template Syntax

You can write double curly brackets to write a couple of neat things inside your HTML to make minimal logic and print data with it.


### 1) Data

Starting with an object defined from our code:

```typescript
const myData = {
  greeting: 'Hello',
  user: {
    firstName: 'John',
    lastName: 'Doe'
  }
};
```

use it in HTML with

```html
<template id="my-data-template">
  <span>{{greeting}} {{user.firstName}} {{user.lastName}}</span>
</template>
```

and after compilation it will turn into

```html
<span>Hello John Doe</span>
```


### 2) Conditions

`{{if condition}}...{{/if}}` and `{{if condition}}...{{else}}...{{/if}}` are the syntaxes that can decide wether the content of the condition will be printed or not for the first case and print either one content block or the other depending on the condition.

The accepted format for conditions are both a single variable that will be implicitly interpreted as a boolean check (much like a common `if()` from JS/TS code) or a set of two variables to evaluate with an operator in between them.

The list of all available operators is the following:
- `==`
- `==`
- `===`
- `!=`
- `!==`
- `>`
- `>=`
- `<`
- `<=`
- `&&`
- `||`
- `%`
- `^`


For the example we'll change the data object a little:

```typescript
const myData = {
  visible: true
};
```

and make a debug-like test template

```html
<template id="my-data-template">
  status:

  {{if visible}}
    <span>true</span>
  {{else}}
    <span>false</span>
  {{/if}}
</template>
```

The output will be

```html
status:
<span>true</span>
```

> NOTE: full condition syntax strictly accepts only the following format: `<parameter_1> <operator> <parameter_2>`.
> Using parenthesis for grouping and/or multiple operators will not work.



### 3) Loops

If our data object contains arrays inside it we can iterate on them using a `{{forEach item in array}}...{{/forEach}}`.
Here's a simple list:

```typescript
const myData = {
  users: [
    {
      firstName: 'John',
      lastName: 'Doe'
    },
    {
      firstName: 'Alex',
      lastName: 'Rodriguez'
    },
    {
      firstName: 'Emily',
      lastName: 'Turner'
    }
  ]
};
```

and whatever HTML is contained inside the loop statement will be repeated for each item

```html
<template id="list-template">
  <h4>List of users</h4>
  <ol>
    {{forEach user in users}}
      <li>
        <div>First name: {{user.firstName}}</div>
        <div>Last name: {{user.lastName}}</div>
      </li>
    {{/forEach}}
  </ol>
</template>
```

And this is how the list turned out after parsing:

```html
<h4>List of users</h4>
<ol>
  <li>
    <div>First name: John</div>
    <div>Last name: Doe</div>
  </li>
  <li>
    <div>First name: Alex</div>
    <div>Last name: Rodriguez</div>
  </li>
  <li>
    <div>First name: Emily</div>
    <div>Last name: Turner</div>
  </li>
</ol>
```

An important note to point out is that if you use an identifier for the list iterable that is already present inside the first level of the data object, the object outside of the list will not be accessible since the identifiers overlap and `forEach`'s scope takes priority.

```typescript
const myData = {
  item: 'OUTSIDE LIST',
  list: [ 'INSIDE LIST' ]
}
```

```html
1. {{item}}

{{forEach item in list}}
  2. {{item}}
{{/forEach}}

3. {{item}}
```

The output will be:
```html
1. OUTSIDE LIST
2. INSIDE LIST
3. OUTSIDE LIST
```



## KNOWN BUGS

- ~~Same statements consecutively inside each other are probably not parsed correctly~~ Fixed in 1.2