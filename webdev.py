import requests
from bs4 import BeautifulSoup
import csv
import re
import time
import os

# 이미 존재하는 CSV 파일에서 강의 제목을 불러오기
existing_courses = []

if os.path.exists('inflearn_courses.csv'):
    with open('inflearn_courses.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        next(reader)  # 헤더 건너뛰기
        for row in reader:
            existing_courses.append(row[1])  # 강의 제목 저장

# 결과를 저장할 CSV 파일 초기화
csv_file = open('inflearn_courses.csv', 'a+', newline='',
                encoding='utf-8')  # 기존 내용을 유지하면서 추가
csv_writer = csv.writer(csv_file)
if os.stat('inflearn_courses.csv').st_size == 0:
    csv_writer.writerow(['provider', 'title', 'description', 'url', 'thumbnail', 'author', 'price', 'level',
                         'category', 'score', 'durationInMinutes', 'skills', 'lastUpdated'])


# 세션 시작
with requests.Session() as s:
    page = 1
    while True:
        time.sleep(0.1)
        print(f'페이지 {page}')
        new_courses_this_page = 0

        # 강의 목록 페이지 접속
        response = s.get(
            f'https://www.inflearn.com/courses/it-programming?order=popular&page={page}')
        soup = BeautifulSoup(response.text, 'html.parser')

        # 강의 목록 추출
        courses = soup.find_all(
            'div', class_="column is-3-fullhd is-3-widescreen is-3-desktop is-4-tablet is-6-mobile")
        if not courses:
            break  # 강의가 없으면 반복 중지

        for course in courses:
            # 필요한 정보 추출
            offline_ribbon_element = course.select_one(
                'div.course-card__offline-ribbon')
            if offline_ribbon_element:
                ribbon_text = offline_ribbon_element.get_text(strip=True)
                if "모임" in ribbon_text or "부트캠프" in ribbon_text:
                    continue  # "모임" 혹은 "부트캠프"를 포함하면 해당 강의는 넘어감
            title = course.select_one('div.course_title').get_text(strip=True)
            if title in existing_courses:
                continue
            else:
                new_courses_this_page += 1

            course_url = 'https://www.inflearn.com' + \
                course.select_one('a.course_card_front')['href']
            thumbnail_element = course.select_one('figure img')  # 간소화된 셀렉터
            thumbnail = thumbnail_element['src'] if thumbnail_element else None
            author = course.select_one('div.instructor').get_text(strip=True)
            price = course.select_one('div.price').get_text(strip=True)
            level_element = course.select_one('div.course_level > span')
            if level_element:
                level = level_element.get_text(strip=True)
            else:
                level = None
            category_element = course.select_one(
                'div.course_categories > span')
            if category_element:
                category = category_element.get_text(strip=True)
            else:
                category = None
            # 강의 상세페이지로 이동
            detail_response = requests.get(course_url)
            detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

            # print(description)
            # 평점 가져오기
            score_element = detail_soup.select_one(
                'div.cd-header__info-cover > span.cd-header__info--star > strong')
            if score_element:
                score_raw = score_element.get_text(strip=True)
                score_search = re.findall(r'\d+\.\d+', score_raw)
                score = score_search[0] if score_search else None
            else:
                score = None

            duration = detail_soup.select_one(
                'span.cd-curriculum__sub-title').get_text(strip=True)
            # 시간과 분을 찾아보기
            time_match = re.search(r'(\d+)시간', duration)
            minute_match = re.search(r'(\d+)분', duration)

            # 시간만 있는 경우
            if time_match and not minute_match:
                hours = time_match.group(1)
                minutes = "00"

            # 분만 있는 경우
            elif minute_match and not time_match:
                hours = "00"
                minutes = minute_match.group(1)

            # 둘 다 있는 경우
            elif time_match and minute_match:
                hours = time_match.group(1)
                minutes = minute_match.group(1)

            # 둘 다 없는 경우
            else:
                hours = "00"
                minutes = "00"

            durationInMinutes = f"{hours}:{minutes}"

            skills = [tag.get_text(strip=True)
                      for tag in detail_soup.select('a.cd-header__tag')]
            skills = ','.join(skills)

            last_updated_element = detail_soup.select_one(
                'div.ac-cd-8.ac-ct-12.ac-left-wrapper > div > section.cd-date > div > span.cd-date__last-updated-at'
            )
            last_updated = last_updated_element.get_text(strip=True)
            # YYYY/MM 형식으로 변환
            last_updated = re.search(
                r'(\d{4})년\s*(\d{1,2})월', last_updated)
            last_updated = f"{last_updated.group(1)}/{last_updated.group(2).zfill(2)}"

            provider = 'inflearn'

            description_element = detail_soup.select_one(
                '#description > p.cd-body__description')
            if (description_element):
                description = description_element.get_text(strip=True)
            else:
                description = None
            # 추출한 정보를 CSV 파일에 쓰기
            csv_writer.writerow([provider, title, description, course_url, thumbnail, author, price,
                                level, category, score, durationInMinutes, skills, last_updated])
            csv_file.flush()  # 파일에 즉시 쓰기

            print(f"Course '{title}' written to CSV.")

            time.sleep(0.5)

        # 다음 페이지로 이동
        page += 1

# 파일 닫기
csv_file.close()
