from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import tiktoken
import re
from urllib.parse import urljoin, urlparse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_KEYWORDS = {
    'login': [r'login', r'sign in', r'log in'],
    'register': [r'register', r'sign up', r'create account'],
    'search': [r'search', r'find'],
    'upload': [r'upload', r'choose file'],
    'pay': [r'pay', r'payment', r'checkout'],
    'reset_password': [r'reset password', r'forgot password'],
    'image_processing': [r'image', r'photo', r'picture', r'gallery', r'edit image', r'compress image', r'optimize image'],
    'video': [r'video', r'youtube', r'vimeo', r'play video', r'embed video'],
    'optimization': [r'optimize', r'performance', r'compress', r'cache'],
    'comment': [r'comment', r'reply', r'leave a comment'],
    'like': [r'like', r'upvote', r'favourite', r'favorite'],
    'share': [r'share', r'send to', r'forward'],
    'map': [r'map', r'location', r'google maps', r'baidu map'],
    'export': [r'export', r'download', r'csv', r'pdf'],
    'import': [r'import', r'upload data', r'parse file'],
    'data_analysis': [r'chart', r'graph', r'statistics', r'analytics', r'data analysis'],
    'ai_chat': [r'chatbot', r'ai assistant', r'ask ai', r'chat with ai'],
}
FEATURE_TOKEN_MAP = {
    'login': (2500, 3500),
    'register': (2500, 3500),
    'search': (1800, 2500),
    'upload': (2000, 3000),
    'pay': (3500, 5000),
    'reset_password': (1500, 2200),
    'image_processing': (2500, 3500),
    'video': (2500, 3500),
    'optimization': (1200, 2000),
    'comment': (1500, 2200),
    'like': (800, 1200),
    'share': (1000, 1500),
    'map': (1800, 2500),
    'export': (1200, 1800),
    'import': (1200, 1800),
    'data_analysis': (3000, 5000),
    'ai_chat': (4000, 6000),
}

class AnalyzeRequest(BaseModel):
    mode: str  # basic/smart/full
    main_url: str
    other_urls: Optional[List[str]] = None

class PageResult(BaseModel):
    url: str
    min_token: int
    max_token: int
    details: Dict[str, Any]

class AnalyzeResult(BaseModel):
    mode: str
    pages: List[PageResult]
    total_min_token: int
    total_max_token: int
    full_min_token: Optional[int] = None
    full_max_token: Optional[int] = None


def analyze_url(url: str) -> PageResult:
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        return PageResult(url=url, min_token=0, max_token=0, details={"error": str(e)})
    soup = BeautifulSoup(resp.text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    enc = tiktoken.get_encoding("cl100k_base")
    text_token = len(enc.encode(text))
    form_count = len(soup.find_all('form'))
    button_count = len(soup.find_all(['button', 'input'], type=lambda x: x=='submit' if x else False))
    lower_html = resp.text.lower()
    features = set()
    for feat, patterns in FEATURE_KEYWORDS.items():
        for pat in patterns:
            if re.search(pat, lower_html):
                features.add(feat)
    feature_min = sum(FEATURE_TOKEN_MAP.get(f, (0,0))[0] for f in features)
    feature_max = sum(FEATURE_TOKEN_MAP.get(f, (0,0))[1] for f in features)
    form_token_min = form_count * 1200
    form_token_max = form_count * 2000
    button_token_min = button_count * 300
    button_token_max = button_count * 600
    text_token_min = int(text_token * 1.1)
    text_token_max = int(text_token * 1.5)
    min_token = text_token_min + form_token_min + button_token_min + feature_min
    max_token = text_token_max + form_token_max + button_token_max + feature_max
    return PageResult(
        url=url,
        min_token=min_token,
        max_token=max_token,
        details={
            "text_token": (text_token_min, text_token_max),
            "form_token": (form_token_min, form_token_max),
            "button_token": (button_token_min, button_token_max),
            "feature_token": (feature_min, feature_max),
            "features": list(features),
            "form_count": form_count,
            "button_count": button_count
        }
    )

def crawl_site(start_url: str, max_pages: int = 20, max_depth: int = 2) -> List[str]:
    visited = set()
    to_visit = [(start_url, 0)]
    domain = urlparse(start_url).netloc
    urls = []
    while to_visit and len(visited) < max_pages:
        url, depth = to_visit.pop(0)
        if url in visited or depth > max_depth:
            continue
        visited.add(url)
        urls.append(url)
        try:
            resp = requests.get(url, timeout=8)
            soup = BeautifulSoup(resp.text, "html.parser")
            for a in soup.find_all('a', href=True):
                link = urljoin(url, a['href'])
                if urlparse(link).netloc == domain and link not in visited:
                    to_visit.append((link, depth+1))
        except Exception:
            continue
    return urls

@app.post("/analyze", response_model=AnalyzeResult)
def analyze(req: AnalyzeRequest):
    mode = req.mode
    pages = []
    total_min = 0
    total_max = 0
    if mode == "basic":
        page_result = analyze_url(req.main_url)
        pages.append(page_result)
        total_min += page_result.min_token
        total_max += page_result.max_token
        return AnalyzeResult(mode=mode, pages=pages, total_min_token=total_min, total_max_token=total_max)
    elif mode == "smart":
        urls = [req.main_url]
        if req.other_urls:
            urls += req.other_urls
        for url in urls:
            page_result = analyze_url(url)
            pages.append(page_result)
            total_min += page_result.min_token
            total_max += page_result.max_token
        return AnalyzeResult(mode=mode, pages=pages, total_min_token=total_min, total_max_token=total_max)
    elif mode == "full":
        crawl_urls = crawl_site(req.main_url, max_pages=30, max_depth=2)
        for url in crawl_urls:
            page_result = analyze_url(url)
            pages.append(page_result)
            total_min += page_result.min_token
            total_max += page_result.max_token
        # 经验：全站页面数约为爬到的1.5~2.5倍
        full_min = int(total_min * 1.5)
        full_max = int(total_max * 2.5)
        return AnalyzeResult(mode=mode, pages=pages, total_min_token=total_min, total_max_token=total_max, full_min_token=full_min, full_max_token=full_max)
    else:
        return AnalyzeResult(mode=mode, pages=[], total_min_token=0, total_max_token=0) 