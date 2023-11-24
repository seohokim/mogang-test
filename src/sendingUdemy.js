"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var csv = require("fast-csv");
var parsePriceUdemy = function (price) {
    return parseInt(price.replace(/₩|,/g, ''), 10) || 0;
};
var formatLevel = function (level) {
    switch (level) {
        case '모든 수준':
            return '입문';
        case '초급자':
            return '초급';
        default:
            return '중급 이상';
    }
};
var addJavaScriptSkill = function (title, description, skills, detail) {
    var skillSet = new Set(skills.split(',').map(function (s) { return s.trim(); }));
    if (/js|자바스크립트|javascript|JS/i.test(title + description + detail)) {
        skillSet.add('JavaScript');
    }
    return Array.from(skillSet);
};
fs.createReadStream(path.resolve(__dirname, 'udemy_courses.csv'))
    .pipe(csv.parse({ headers: true, escape: '"' }))
    .on('data', function (row) {
    var price = parsePriceUdemy(row.price);
    var lectureJson = {
        provider: row.provider,
        title: row.title,
        url: row.url,
        thumbnailUrl: row.thumbnailUrl,
        description: row.description.replace(/\\n/g, '\n'),
        author: row.author,
        originPrice: price,
        currentPrice: price,
        level: formatLevel(row.level),
        category: row.category.split(',').map(function (s) { return s.trim(); }),
        score: row.score ? (typeof row.score === 'string' ? parseFloat(row.score) : row.score) : 0.0,
        duration: row.duration,
        skills: addJavaScriptSkill(row.title, row.description, row.skills, row.detail),
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
