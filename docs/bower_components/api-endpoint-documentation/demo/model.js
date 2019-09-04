const generator = require('@api-components/api-model-generator');
generator('./demo/api.json')
.then(() => console.log('Models created'))
.catch((cause) => console.error(cause));
