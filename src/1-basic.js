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
