import * as fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const readStream = fs.createReadStream('inflearn_courses.csv');
const writeStream = fs.createWriteStream('output.csv');
const csvWriter = createObjectCsvWriter({
    path: 'output.csv',
    header: [
        'provider',
        'title',
        'url',
        'thumbnail',
        'author',
        'price',
        'level',
        'category',
        'score',
        'duration',
        'skills',
        'lastUpdated',
    ],
});

const rows: any[] = [];
let lineCount = 0;

readStream
    .pipe(csvParser())
    .on('data', (row) => {
        lineCount++;
        if (lineCount % 2 === 0) {
            // Check for even lines
            row.provider = 'udemy'; // Update the provider field
        }
        rows.push(row);
    })
    .on('end', () => {
        csvWriter.writeRecords(rows).then(() => console.log('CSV file was written successfully.'));
    });
