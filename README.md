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
  printTargetNode: appNode,

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
  value: 'hello world'
};
```

use it in HTML with

```html
<template id="my-data-template">
  <span>{{value}}</span>
</template>
```

and after compilation it will turn into

```html
<span>hello world</span>
```


### 2) Conditions

`{{if condition}}...{{/if}}` is the syntax that can decide wether the content of the condition will be printed or not.
This is the list of all available operators:
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

A single variable passed as condition to the IF statement will be interpreted as implicit boolean much like a common IF from code.


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


## KNOWN BUGS

- Same statements consecutively inside each other are probably not parsed correctly