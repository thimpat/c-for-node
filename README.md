
C-node is a module that allows invoking C code from your nodeJs application.
The module uses TCC under the hood

## Installation

```shell
npm install c-node
```

<br/>

---

## Usage

CJS
```javascript
const cNode = require("c-node");
```

<br/>

ESM

```javascript
import cNode from "c-node";
```

<br/>

----

### From a shell

```shell
// C-node uses the TCC compiler under the hood.
$> c-node [options] 
```

---

## Examples

All examples are part of the TCC library

### Compilation

<br/>

#### Example 1 - Compile a C program to an executable

```javascript
const {compileSource} = require("c-node");
const {success, status} = compileSource("examples/hello_win.c");
if (!success)
{
    console.error(`Compilation failed. Status: ${status}`)
}
```

<br/>

---
#### Example 2 - Compile a C source to a shared library (dll)

```javascript
const {compileSource} = require("c-node");
const {success, status} = compileSource("examples/dll.c", {binType: BIN_TYPE.SHARED})
```

<br/>

---

### Execution

<br/>

#### Example 3 - Run source immediately after compiling

###### example.js ↴
```javascript
const {runFile} = require("c-node");
runFile("examples/hello_win.c");
```

💻  ↴

![Message Box Hello World](https://raw.githubusercontent.com/thimpat/demos/main/c-node/images/message-box-hello-world.png)

<br/>

---

### Run source using JIT (Just in time compilation)

###### example.js ↴
```javascript
const {runLive} = require("c-node");

// No generated executable, runs from source code
runLive("examples/hello_win.c");
```

<br/>
