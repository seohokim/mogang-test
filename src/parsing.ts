import fs from 'fs';
import csv from 'csv-parser';
import * as path from 'path';

const categories = new Set<string>();
const skills = new Set<string>();

fs.createReadStream(path.resolve(__dirname, 'inflearn_courses.csv'))
    .pipe(csv())
    .on('data', (row) => {
        // category와 skills 필드를 파싱합니다. 여기서는 CSV의 필드가 "프론트엔드, 웹 개발"과 같은 형식으로 저장되어 있다고 가정합니다.
        const categoryList = row.category.split(',').map((s: string) => s.trim());
        const skillsList = row.skills.split(',').map((s: string) => s.trim());

        // 각각의 고유 값을 Set에 추가합니다.
        categoryList.forEach((category: string) => categories.add(category));
        skillsList.forEach((skill: string) => skills.add(skill));
    })
    .on('end', () => {
        console.log('Categories:', [...categories]);
        console.log('Skills:', [...skills]);
    });
