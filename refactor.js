const fs = require('fs');
const path = require('path');

const dir = './app';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(dir);

const replacements = [
    { regex: /(?<=["'\s])border-gray-50(?=["'\s])/g, replace: 'border-card-border' },
];

let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(({regex, replace}) => {
        content = content.replace(regex, replace);
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log("Updated " + file);
    }
});

console.log("Total files updated: " + changedCount);
