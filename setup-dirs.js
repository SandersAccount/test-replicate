import fs from 'fs';
import path from 'path';

const dirs = [
    'public/images',
    'public/js/components',
    'public/css'
];

dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
    }
});
