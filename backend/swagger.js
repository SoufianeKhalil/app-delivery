const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Delivery App API',
    description: 'Auto generated API documentation',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./server.js']; 
// or ['./app.js'] depending on your main file

swaggerAutogen(outputFile, endpointsFiles, doc);
