import * as fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// CSV 행의 타입을 정의
interface Course {
    provider: string;
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    author: string;
    price: string;
    level: string;
    category: string;
    score: string;
    durationInMinutes: string;
    skills: string;
    lastUpdated: string;
}

// 입력 CSV 파일 스트림 생성
const readStream = fs.createReadStream('inflearn_courses.csv');

// 출력 CSV 파일 작성기 설정
const csvWriter = createObjectCsvWriter({
    path: 'output.csv',
    header: [
        { id: 'provider', title: 'provider' },
        { id: 'title', title: 'title' },
        { id: 'description', title: 'description' },
        { id: 'url', title: 'url' },
        { id: 'thumbnail', title: 'thumbnail' },
        { id: 'author', title: 'author' },
        { id: 'price', title: 'price' },
        { id: 'level', title: 'level' },
        { id: 'category', title: 'category' },
        { id: 'score', title: 'score' },
        { id: 'durationInMinutes', title: 'durationInMinutes' },
        { id: 'skills', title: 'skills' },
        { id: 'lastUpdated', title: 'lastUpdated' },
    ],
    append: false,
    alwaysQuote: true,
});

// 줄 번호와 행 배열
let lineCount = 0;
const courses: Course[] = [];

readStream
    .pipe(csvParser())
    .on('data', (course: Course) => {
        lineCount++;
        if (lineCount % 2 === 0) {
            // 짝수 번째 라인의 provider를 'udemy'로 변경
            course.provider = 'udemy';
        }
        courses.push(course);
    })
    .on('end', async () => {
        try {
            await csvWriter.writeRecords(courses);
            console.log('CSV file has been written successfully.');
        } catch (err) {
            console.error('An error occurred while writing the CSV file.', err);
        }
    });
