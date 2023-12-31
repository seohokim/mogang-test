import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';

interface Lecture {
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

const parsePrice = (price: string): [number, number] => {
    const prices = price.match(/₩\d+(,\d{3})*/g);
    if (prices) {
        const numericPrices = prices.map((p) => parseInt(p.replace(/₩|,/g, ''), 10));
        if (numericPrices.length === 1) {
            // 가격이 하나인 경우, 두 위치 모두 같은 값으로 설정
            return [numericPrices[0], numericPrices[0]];
        } else if (numericPrices.length > 1) {
            // 가격이 둘인 경우, 첫 번째는 origin, 두 번째는 current로 설정
            return [numericPrices[0], numericPrices[1]];
        }
    }
    // 매칭되는 가격이 없거나 잘못된 형식의 경우 기본값 반환
    console.log('price parsing error');
    return [0, 0];
};

const formatDuration = (duration: string): string => {
    console.log(duration);
    // "0:MM" 형식으로 변경
    duration = duration.replace(/^0:/, '0:0');

    // "HH:0M" 형식으로 변경
    duration = duration.replace(/:(\d{1})$/, ':0$1');

    return duration;
};

fs.createReadStream(path.resolve(__dirname, 'inflearn_courses.csv'))
    .pipe(csv.parse({ headers: true, escape: '"' }))
    .on('data', (row: Lecture) => {
        const [originPrice, currentPrice] = parsePrice(row.price);
        const lectureJson: LectureJson = {
            provider: row.provider,
            title: row.title,
            url: row.url,
            thumbnailUrl: row.thumbnailUrl,
            description: row.description.replace(/\\n/g, '\n'), // Assuming the CSV escapes new lines as \n
            author: row.author,
            originPrice: originPrice,
            currentPrice: currentPrice,
            level: row.level,
            category: row.category.split(',').map((s) => s.trim()),
            score: row.score ? (typeof row.score === 'string' ? parseFloat(row.score) : row.score) : 0.0,
            duration: formatDuration(row.duration),
            skills: row.skills.split(',').map((s) => s.trim()),
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
