import requests, time
from abc import ABC, abstractmethod
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class BaseScraper(ABC):
    def __init__(self, headers=None, rate_limit_delay=2.0):
        self.session = self._build_session()
        self.delay = rate_limit_delay
        self.headers = headers or self._headers()

    def _headers(self) -> dict:
        return {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

    def _build_session(self):
        retries = Retry(
            total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503]
        )

        session = requests.Session()
        session.mount("https://", HTTPAdapter(max_retries=retries))

        return session

    def get(self, url, **kwargs):
        time.sleep(self.delay)

        response = self.session.get(url, timeout=30, **kwargs)
        response.raise_for_status()

        return response

    def post(self, url, data, **kwargs):
        time.sleep(self.delay)

        response = self.session.post(url, data, timeout=30, **kwargs)
        response.raise_for_status()

        return response

    @abstractmethod
    def fetch(self, **kwargs) -> list[dict]:
        """return list of raw lead dicts"""
        pass
