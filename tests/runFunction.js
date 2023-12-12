// runFunction.js

const { test_date} = require('./test');

const functionName = process.argv[2];

console.log(functionName)

switch (functionName) {
    case 'test_date':
        test_date();
        break;
    default:
        console.log("Function not found");
}
