import * as fs from 'fs';
import * as readline from 'readline';

// 파일 읽기 준비
const fileStream = fs.createReadStream('inflearn_courses.csv');

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
});

// 결과를 저장할 배열
const lines: string[] = [];

// 첫 줄을 확인하기 위한 플래그
let isFirstLine = true;

// 헤더 저장 변수
let headerLine = '';

// 파일을 줄 단위로 읽기
rl.on('line', (line: string) => {
    // 첫 줄이면 헤더라고 가정하고 저장
    if (isFirstLine) {
        headerLine = line;
        isFirstLine = false;
    } else {
        // 짝수 줄만 처리
        if (lines.length % 2 === 1) {
            const columns = line.split(',');
            columns[0] = 'udemy'; // provider를 udemy로 변경
            line = columns.join(',');
        }
        lines.push(line);
    }
});

rl.on('close', () => {
    // 모든 줄이 처리되었으면 파일 쓰기
    const outputPath = 'output.csv';
    fs.writeFileSync(outputPath, headerLine + '\n' + lines.join('\n'));
    console.log(`Updated CSV has been written to ${outputPath}`);
});
