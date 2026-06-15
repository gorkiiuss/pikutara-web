const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

let line = 1;
let col = 1;
let braces = [];
let parens = [];
let insideString = false;
let stringChar = '';
let templateLiteralStack = []; // track nesting inside backticks
let isEscape = false;

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  
  if (isEscape) {
    isEscape = false;
    if (char === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    continue;
  }

  if (char === '\\') {
    isEscape = true;
    col++;
    continue;
  }

  if (insideString) {
    if (char === stringChar) {
      insideString = false;
      if (char === '`') {
        templateLiteralStack.pop();
      }
    } else if (char === '$' && code[i+1] === '{' && stringChar === '`') {
      // Entering template expression ${...} inside backticks
      templateLiteralStack.push('expr');
      insideString = false; // suspend string state
      i++; // skip {
      col += 2;
      braces.push({ line, col, index: i, type: 'template' });
      continue;
    }
    if (char === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    continue;
  }

  if (char === "'" || char === '"' || char === '`') {
    insideString = true;
    stringChar = char;
    if (char === '`') {
      templateLiteralStack.push('string');
    }
    col++;
    continue;
  }

  // Check if we are inside a template literal expression and encounter }
  if (char === '}' && templateLiteralStack.length > 0 && templateLiteralStack[templateLiteralStack.length - 1] === 'expr') {
    templateLiteralStack.pop();
    insideString = true;
    stringChar = '`';
    if (braces.length > 0 && braces[braces.length - 1].type === 'template') {
      braces.pop();
    } else {
      console.warn(`Warning: Closing template expression brace mismatch at line ${line}, col ${col}`);
    }
    col++;
    continue;
  }

  if (char === '/' && code[i+1] === '/') {
    while (i < code.length && code[i] !== '\n') {
      i++;
    }
    line++;
    col = 1;
    continue;
  }

  if (char === '/' && code[i+1] === '*') {
    i += 2;
    col += 2;
    while (i < code.length && !(code[i] === '*' && code[i+1] === '/')) {
      if (code[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
    i++; // skip /
    col += 2;
    continue;
  }

  if (char === '\n') {
    line++;
    col = 1;
    continue;
  }

  if (char === '{') {
    braces.push({ line, col, index: i, type: 'normal' });
  } else if (char === '}') {
    if (braces.length === 0) {
      console.error(`Extra } at line ${line}, col ${col}`);
    } else {
      braces.pop();
    }
  } else if (char === '(') {
    parens.push({ line, col, index: i });
  } else if (char === ')') {
    if (parens.length === 0) {
      console.error(`Extra ) at line ${line}, col ${col}`);
    } else {
      parens.pop();
    }
  }
  col++;
}

console.log('Open braces remaining:', braces.length);
braces.forEach(b => {
  console.log(`- Open brace at line ${b.line}, col ${b.col} (${b.type}): ... ${code.slice(b.index - 30, b.index + 30).replace(/\n/g, ' ')} ...`);
});

console.log('Open parens remaining:', parens.length);
parens.forEach(p => {
  console.log(`- Open paren at line ${p.line}, col ${p.col}: ... ${code.slice(p.index - 30, p.index + 30).replace(/\n/g, ' ')} ...`);
});
