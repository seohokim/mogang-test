"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var csv = require("fast-csv");
var parsePrice = function (price) {
    var prices = price.match(/₩\d+(,\d{3})*/g);
    if (prices) {
        var numericPrices = prices.map(function (p) { return parseInt(p.replace(/₩|,/g, ''), 10); });
        if (numericPrices.length === 1) {
            // 가격이 하나인 경우, 두 위치 모두 같은 값으로 설정
            return [numericPrices[0], numericPrices[0]];
        }
        else if (numericPrices.length > 1) {
            // 가격이 둘인 경우, 첫 번째는 origin, 두 번째는 current로 설정
            return [numericPrices[0], numericPrices[1]];
        }
    }
    // 매칭되는 가격이 없거나 잘못된 형식의 경우 기본값 반환
    console.log('price parsing error');
    return [0, 0];
};
var formatDuration = function (duration) {
    console.log(duration);
    // "0:MM" 형식으로 변경
    duration = duration.replace(/^0:/, '0:0');
    // "HH:0M" 형식으로 변경
    duration = duration.replace(/:(\d{1})$/, ':0$1');
    return duration;
};
fs.createReadStream(path.resolve(__dirname, 'inflearn_courses.csv'))
    .pipe(csv.parse({ headers: true, escape: '"' }))
    .on('data', function (row) {
    var _a = parsePrice(row.price), originPrice = _a[0], currentPrice = _a[1];
    var lectureJson = {
        provider: row.provider,
        title: row.title,
        url: row.url,
        thumbnailUrl: row.thumbnailUrl,
        description: row.description.replace(/\\n/g, '\n'),
        author: row.author,
        originPrice: originPrice,
        currentPrice: currentPrice,
        level: row.level,
        category: row.category.split(',').map(function (s) { return s.trim(); }),
        score: row.score ? (typeof row.score === 'string' ? parseFloat(row.score) : row.score) : 0.0,
        duration: formatDuration(row.duration),
        skills: row.skills.split(',').map(function (s) { return s.trim(); }),
        lectureUpdatedAt: row.lectureUpdatedAt,
    };
    axios_1.default
        .post('http://localhost:3000/graphql', {
        query: "\n        mutation CreateLecture($input: CreateLectureInputDto!) {\n          createLecture(createLectureInput: $input) {\n            ok\n            message\n            lecture {\n              id\n              title\n            }\n          }\n        }\n      ",
        variables: {
            input: lectureJson,
        },
    })
        .then(function (response) { return console.log(response.data); })
        .catch(function (error) { return console.error(error); });
})
    .on('end', function (rowCount) { return console.log("Parsed ".concat(rowCount, " rows")); });
