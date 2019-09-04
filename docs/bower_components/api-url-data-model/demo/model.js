const generator = require('@api-components/api-model-generator');

const files = new Map();
files.set('demo-api/demo-api.raml', 'RAML 1.0');
files.set('loan-ms/loan-microservice.json', 'OAS 2.0');
files.set('petstore/petstore.json', 'OAS 2.0');

generator(files)
.then(() => console.log('Finito'));
