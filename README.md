# AC stands for AbortController not for Air Conditioner

### Motivation
I don't even know when this thing was added to the Node, but it seems to me that by now quite a little people know about it or have cases in mind for its use. sooo....

_P.S._ This feature was introduced in Node v15.0.0 😱 

### What is in this article

First of all, I would like to consider cases of practical application of the principles of working with the new API.

### But before that, we can give a little theory

Depending on the runtime environment, the JS engine offloads asynchronous processes, such as making network requests, file system access, and other time-consuming jobs, to some APIs to achieve asynchronously.

Ordinarily, we expect the result of an asynchronous operation to succeed or fail. However, the process can also take more time than anticipated, or you may no longer need the results when you receive them.

## Practice
Some examples run in a browser environment, some on a Node. I want to note right away that the interfaces in the browser and in the Node are same.
All the code that will be provided can be found [here](https://github.com/La7rodectus/abort-controller-pubJS).

### Basic API usage

<font color="yellow">**1-basic**</font>

So as a base we have a class whose constructor takes no parameters, but instead has a <font color="yellow">signal</font> field. The instance of the class has an <font color="green">abort</font> method, which aborts (sends an event to the attached <font color="yellow">signal</font>) our process.

The <font color="yellow">signal</font> itself implements the <font color="yellow">EventEmitter</font> interface, so we can listen to '*abort*' event. We can also read the <font color="green">abort</font> reason, through the reason field of <font color="yellow">signal</font>, which is set by the parameter of the <font color="green">abort</font> method of <font color="yellow">AbortController</font>.

The reason param has not restrictions on the type. If you do not pass the parameter to the <font color="green">abort</font> method, the reason will be *undefined*. Also, we cannot send the '*abort*' event on the same signal several times. That means, one signal = one abort. The <font color="green">signal.aborted</font> field is responsible for this.

```js
const ac = new AbortController();
const { signal } = ac;

const signalEventHandler = () => {
  console.log('Is aborted:', signal.aborted);
  console.log('Reason:', signal.reason);
};

signal.addEventListener('abort', signalEventHandler);

console.log('Is aborted before abort:', ac.signal.aborted);

ac.abort('Please stop!');
ac.abort({ lol: 'kek' }); // Reason: { lol: 'kek' }
ac.abort();               // Reason: undefined

console.log('Is aborted after abort:', ac.signal.aborted);

signal.removeEventListener('abort', signalEventHandler);
```

### Out of the box support 

<font color="yellow">**2-fetch**</font>

<font color="yellow">**3-fs**</font>

The signal attached to the <font color="yellow">AbortController</font> can be transmitted to many functions or processes that support the abortable contract. All functions that received signal could be stopped at the same time using the <font color="yellow">AbortController</font>. Some standard APIs support abortable contract out of the box, for example we will look at <font color="green">fs.readFile</font> and <font color="green">fetch</font>. So, we just simply pass a reference to the <font color="green">signal</font> to the options of our method. Thus, as soon as we call the <font color="green">abort</font> method of the corresponding controller, the process will stop.

```js
const fs = require('fs');
const path = require('path');

const ac = new AbortController();
const { signal } = ac;

const pathToFile = path.resolve(__dirname, 'file.txt');

fs.readFile(pathToFile, { signal, encoding: 'utf8' }, (err, data) => {
  if (err) {
    if (err.name === 'AbortError') {
      console.log('Read file process was aborted!');
    } else {
      console.log('Abort haven\'t work!\n');
      console.error(err);
    }
  } else {
    console.log('Abort haven\'t work!\n');
    console.log(data);
  }
});

ac.abort();
```

In the given snippet, we can see how to simultaneously abort several processes by sending them the same signal with the help of <font color="yellow">AbortController</font>.

As a result, we expect to receive 4 simultaneous messages '*Successful abort!*'.

```js
const url = 'https://jsonplaceholder.typicode.com/todos/1';

const ac = new AbortController();
const { signal } = ac;

const execRequest = async (signal) => {
  try {
    const response = await fetch(url, { signal });
    const data = await response.json();
    console.log('Fetched data:', data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Successful abort!');
    } else {
      console.log('Abort haven\'t work!');
      console.error('Error during fetch:', err);
    }
  }
};

execRequest(signal);
execRequest(signal);

Promise.all(Array(2).fill().map(() => execRequest(signal)));

ac.abort()
```

### Implementation of abortable contract

<font color="yellow">**4-abortable**</font>

Let's consider the case where we have a large piece of user-triggered asynchronous logic. At some point it will need to be canceled. So we can implement an abortable contract to abort all requests with a single method, which is pretty convenient.

For example, we will read a file. Logic is not that important right now. First, we check whether the transmitted signal is not yet activated, and then we add a listener to the abort event.

Be sure to pass the '*once*' parameter so that the listener is deleted automatically after the first call. In the same way, after working out the code, we also delete listener, even if the process was not aborted, to avoid memory losses.

So under the hood we have another controller that helps to interrupt the internal logic, but it is not visible from the upper scope. So by sending one signal we can interrupt processes without knowing about their internal implementation.

```js
const fs = require('fs/promises');
const path = require('path');

const pathToFile = path.resolve(__dirname, 'file.txt');

const abortable = async (options = {}) => {
  const { signal } = options;

  const iac = new AbortController();
  const internalSignal = iac.signal;

  if (signal?.aborted) throw new Error(signal.reason);
  const abortEventListener = () => {
    console.log('abortEventListener was called!');
    iac.abort();
    //some other abort logic
  };
  if (signal) {
    signal.addEventListener('abort', abortEventListener, { once: true });
  }

  try {
    const data = await fs.readFile(pathToFile, { signal: internalSignal, encoding: 'utf8' });
    console.log('Abort haven\'t work!\n');
    console.log(data);
    //some other async or sync logic
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Read file process was aborted!');
    } else {
      console.log('Abort haven\'t work!\n');
      console.error(err);
    }
  } finally {
    if (signal) {
      signal.removeEventListener('abort', abortEventListener);
    }
  }
};

const ac = new AbortController();
const { signal } = ac;

abortable({ signal });

ac.abort();
```
