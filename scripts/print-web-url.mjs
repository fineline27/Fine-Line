const port = process.argv[2] ?? '8081';
const url = `http://localhost:${port}`;

console.log('');
console.log('============================================');
console.log('  Open this URL in your browser:');
console.log(`  ${url}`);
console.log('============================================');
console.log('(Leave this terminal running while you use the app.)');
console.log('');
