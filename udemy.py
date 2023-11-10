import requests
from bs4 import BeautifulSoup
import csv
import time
import random
import os
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from selenium.webdriver.chrome.options import Options
import time
import undetected_chromedriver as uc

# 이미 존재하는 CSV 파일에서 강의 제목을 불러오기
existing_courses = []

if os.path.exists('udemy_courses.csv'):
    with open('udemy_courses.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        next(reader)  # 헤더 건너뛰기
        for row in reader:
            existing_courses.append(row[3])  # 강의 url 저장


# 결과를 저장할 CSV 파일 초기화
csv_file = open('udemy_courses.csv', 'a+', newline='', encoding='utf-8')
csv_writer = csv.writer(csv_file)
if os.stat('udemy_courses.csv').st_size == 0:
    csv_writer.writerow(['provider', 'title', 'description', 'url', 'thumbnailUrl', 'author',
                         'price', 'level', 'category', 'score', 'skills', 'lastUpdated', 'duration', 'details'])

user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

# undetected_chromedriver 설정
options = uc.ChromeOptions()
options.headless = False  # 필요하다면 headless 모드를 활성화합니다.
options.add_argument(f'user-agent={user_agent}')
options.add_argument('accept-language=en-US,en;q=0.9')
driver = uc.Chrome(options=options)

for page in range(1, 30):

    print(f'페이지 {page}')

    # 페이지 별로 URL 설정
    driver.get(
        f'https://www.udemy.com/courses/development/?lang=ko&p={page}&sort=newest')

    # 페이지가 로드될 때까지 기다립니다.
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, 'div.course-list--container--FuG0T > div'))
    )

    # 현재 페이지의 소스를 가져와서 BeautifulSoup 객체를 생성합니다.
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    courses_list = soup.select('div.course-list--container--FuG0T > div')

    current_page_urls = [course.select_one('div > div > h3 > a')[
        'href'] for course in courses_list if course.select_one('div > div > h3 > a')]

    if all(('https://www.udemy.com' + url) in existing_courses for url in current_page_urls):
        continue

    # 해당 페이지의 강의 목록 추출
    for course in courses_list:
        # 각 강의별 정보 추출
        title_element = course.select_one(
            'h3[data-purpose="course-title-url"] a')
        if (not (title_element)):
            continue
        title = course.select_one(
            'h3[data-purpose="course-title-url"] a').contents[0].strip()

        # print(f'타이틀 {title}')
        description = course.select_one('p').text.strip()
        # print(f'디스크립션 {description}')
        url = 'https://www.udemy.com' + \
            course.select_one('div > div > h3 > a')['href']
        # print(f'유알엘 {url}')
        if url not in existing_courses:
            thumbnailUrl = course.select_one(
                'div.course-card-module--image-container--20x0M > img')['src']
            # print(f'썸네일 {thumbnailUrl}')
            author = course.select_one('div.ud-text-xs > div').text.strip()
            # print(f'작가 {author}')
            level_element = course.select_one(
                'div.course-card-details-module--row--3sv2A > div > span:nth-child(3)')
            if (level_element):
                level = level_element.text.strip()
            else:
                continue
            # print(f'레벨 {level}')
            score_element = course.select_one(
                'span.star-rating-module--star-wrapper--VHfnS.star-rating-module--medium--3kDsb > span.ud-heading-sm.star-rating-module--rating-number--2xeHu')
            # print(score_element)
            if (score_element):
                score = score_element.text.strip()
            else:
                score = 0.0
            # print(f'스코어 {score}')
            # 상세 페이지 접속
            random_sec = random.uniform(4, 6)
            time.sleep(random_sec)  # 페이지 전환 시간 지연
            driver.get(url)
            WebDriverWait(driver, 10).until(
                EC.all_of(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, 'div.curriculum--curriculum-sub-header--m_N_0')),
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, 'div.sidebar-container--purchase-section--2DONZ > div > div > div.generic-purchase-section--buy-box-main--2o6Au > div > div:nth-child(2) > div > div > div > span:nth-child(2) > span')),
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, 'div.clp-lead__element-meta'))
                )
            )

            # 현재 페이지의 소스를 다시 가져옵니다.
            course_soup = BeautifulSoup(driver.page_source, 'html.parser')

            # 이후 BeautifulSoup 객체를 사용하여 HTML을 파싱하고 원하는 데이터를 추출할 수 있습니다.

            # 상세 페이지에서 추가 정보 추출
            last_updated_raw = course_soup.select_one(
                'div.clp-lead__element-meta > div:nth-child(1) > div > span').text.strip()
            last_updated_match = re.search(
                r'마지막 업데이트: (\d{4})\. (\d{1,2})\.', last_updated_raw)
            if last_updated_match:
                year, month = last_updated_match.groups()
                last_updated = f"{year}/{int(month):02d}"
            else:
                last_updated = "날짜 정보 없음"  # 적절한 오류 처리
            # print(f'업데이트? :{last_updated}')
            price_tag = course_soup.find('meta', property='udemy_com:price')

            # 해당 태그에서 'content' 속성의 값을 추출합니다.

            if price_tag and 'content' in price_tag.attrs:
                # '₩23,000'과 같은 텍스트에서 숫자만 추출하여 정수로 변환합니다.
                price_text = price_tag['content']
                price = int(
                    re.search(r'₩([\d,]+)', price_text).group(1).replace(',', ''))
            else:
                price = 0  # 혹은 적절한 오류 처리
            # print(f'가격 {price}')

            duration_raw = course_soup.select_one(
                'div.curriculum--curriculum-sub-header--m_N_0 > div > span > span > span').text.strip()
            hours_match = re.search(r'(\d+)\s*시간', duration_raw)
            minutes_match = re.search(r'(\d+)\s*분', duration_raw)

            # 찾은 값에 따라 hours와 minutes를 할당합니다.
            hours = int(hours_match.group(1)) if hours_match else 0
            minutes = int(minutes_match.group(1)) if minutes_match else 0

            # HH:MM 형식으로 출력 (분이 한 자리수면 0을 붙여서 표현)
            duration = f"{hours}:{minutes:02d}"

            # print(f'듀레이션 : {duration}')
            category = course_soup.select_one(
                'div.top-container.dark-background > div > div > div.course-landing-page__main-content.course-landing-page__topic-menu.dark-background-inner-text-container > div > a:nth-child(3)').text.strip()
            # print(f'카테고리 : {category}')
            skills_raw = course_soup.select_one(
                'div.top-container.dark-background > div > div > div.course-landing-page__main-content.course-landing-page__topic-menu.dark-background-inner-text-container > div > a:nth-child(5)').text.strip()
            skills = re.sub(r'\(.+\)', '', skills_raw)
            # print(f'스킬 : {skills}')

            details_element = course_soup.select(
                'span.what-you-will-learn--objective-item--3b4zX')

            # 각 요소의 텍스트를 추출하고, strip() 함수를 사용하여 공백 제거
            details_list = [detail.text.strip() for detail in details_element]

            # details_list가 비어있지 않다면, join() 함수를 사용하여 문자열 결합
            # 그렇지 않다면, details를 None으로 설정
            if details_list:
                details = ', '.join(details_list)
            else:
                details = None

            # CSV 파일에 쓰기
            csv_writer.writerow(['udemy', title, description, url, thumbnailUrl,
                                author, price, level, category, score, skills, last_updated, duration, details])
            csv_file.flush()
            print(f"Course '{title}' written to CSV.\n\n")
            random_sec = random.uniform(3, 5)
            time.sleep(random_sec)  # 페이지 전환 시간 지연

# 파일 닫기
csv_file.close()
