const fs = require('fs');

// Read the input file
const inputFile = 'inputs/mixer_input.json';
const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Check pathElements
const pathElements = input.pathElements;
const pathLength = pathElements.length;

console.log('Checking SMT path requirements:');
console.log(`- Path length: ${pathLength}`);
console.log(`- Last element (should be 0): ${pathElements[pathLength - 1]}`);
console.log(`- Second-to-last element (should be non-zero): ${pathElements[pathLength - 2]}`);

// Count how many elements are zero
const zeroCount = pathElements.filter(el => el === "0").length;
console.log(`- Number of zero elements: ${zeroCount}`);

// Fix the path if necessary
let modified = false;

// Ensure last element is zero
if (pathElements[pathLength - 1] !== "0") {
    pathElements[pathLength - 1] = "0";
    modified = true;
    console.log('- Fixed: Set last element to 0');
}

// Ensure second-to-last element is non-zero
if (pathElements[pathLength - 2] === "0") {
    // Generate a random non-zero field element
    const randomBigInt = () => {
        // Simple non-zero value for testing
        return "12345678901234567890123456789012345678901234567890";
    };
    
    pathElements[pathLength - 2] = randomBigInt();
    modified = true;
    console.log('- Fixed: Set second-to-last element to non-zero');
}

// Write back modified input if changes were made
if (modified) {
    fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
    console.log('Input file updated with fixes.');
} else {
    console.log('No fixes needed. Input file meets SMT requirements.');
}

console.log('\nFinal path values:');
console.log(`- Last element: ${pathElements[pathLength - 1]}`);
console.log(`- Second-to-last element: ${pathElements[pathLength - 2]}`); 