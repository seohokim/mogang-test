import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';

interface UdemyLecture {
    provider: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    author: string;
    price: string;
    level: string;
    description: string;
    category: string;
    score: number;
    duration: string;
    skills: string;
    lectureUpdatedAt: string;
    detail: string;
}

interface LectureJson {
    provider: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    author: string;
    originPrice: number;
    currentPrice: number;
    level: string;
    description: string;
    category: string[];
    score: number;
    duration: string;
    skills: string[];
    lectureUpdatedAt: string;
}

const parsePriceUdemy = (price: string): number => {
    return parseInt(price.replace(/₩|,/g, ''), 10) || 0;
};

const formatLevel = (level: string): string => {
    switch (level) {
        case '모든 수준':
            return '입문';
        case '초급자':
            return '초급';
        default:
            return '중급 이상';
    }
};

const addJavaScriptSkill = (title: string, description: string, skills: string, detail: string): string[] => {
    const skillSet = new Set(skills.split(',').map((s) => s.trim()));
    if (/js|자바스크립트|javascript|JS/i.test(title + description + detail)) {
        skillSet.add('JavaScript');
    }
    return Array.from(skillSet);
};

fs.createReadStream(path.resolve(__dirname, 'udemy_courses.csv'))
    .pipe(csv.parse({ headers: true, escape: '"' }))
    .on('data', (row: UdemyLecture) => {
        const price = parsePriceUdemy(row.price);
        const lectureJson: LectureJson = {
            provider: row.provider,
            title: row.title,
            url: row.url,
            thumbnailUrl: row.thumbnailUrl,
            description: row.description.replace(/\\n/g, '\n'),
            author: row.author,
            originPrice: price,
            currentPrice: price,
            level: formatLevel(row.level),
            category: row.category.split(',').map((s) => s.trim()),
            score: row.score ? (typeof row.score === 'string' ? parseFloat(row.score) : row.score) : 0.0,
            duration: row.duration,
            skills: addJavaScriptSkill(row.title, row.description, row.skills, row.detail),
            lectureUpdatedAt: row.lectureUpdatedAt,
        };

        axios
            .post('http://localhost:3000/graphql', {
                query: `
        mutation CreateLecture($input: CreateLectureInputDto!) {
          createLecture(createLectureInput: $input) {
            ok
            message
            lecture {
              id
              title
            }
          }
        }
      `,
                variables: {
                    input: lectureJson,
                },
            })
            .then((response) => console.log(response.data))
            .catch((error) => console.error(error));
    })
    .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
