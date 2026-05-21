import logging, re, json
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from models.MarriageLead import MarriageLead


class MarriageLicenseScraper(BaseScraper):
    """
    Scrapes publicly available marriage license indexes from
    county clerk websites.

    These are NOT marriage certificates — they are index records
    of licenses *issued*, which are public record in most US states
    under open records / sunshine laws.
    """

    COUNTY_REGISTRY = {
        "broward": {
            "name": "Broward County Clerk",
            "state": "FL",
            "county": "Broward",
            "search_url": "https://www.browardclerk.org/Web2/Marriage/MarriageLicenseSearchResults",
            "method": "post",
            "parser": "_parse_broward",
        }
    }

    def __init__(self, days_back: int = 14, rate_limit_delay: float = 4.0):
        super().__init__(rate_limit_delay=rate_limit_delay)

        self.counties = self.COUNTY_REGISTRY.keys()
        self.days_back = days_back
        self.logger = logging.getLogger(self.__class__.__name__)

    def fetch(self) -> list[MarriageLead]:
        all_leads: list[MarriageLead] = []

        end_date = datetime.now()
        start_date = end_date - timedelta(days=self.days_back)
        date_from = start_date.strftime("%m/%d/%Y")
        date_to = end_date.strftime("%m/%d/%Y")
        data = {"fromdate": date_from, "todate": date_to}

        for county_key in self.counties:
            config = self.COUNTY_REGISTRY.get(county_key)

            if not config:
                self.logger.error(f"Missing config for county: {county_key}")
                continue

            self.logger.info(f"Querying index: {config['name']}")
            try:
                request_with_method = getattr(self, config["method"])
                resp = request_with_method(
                    config["search_url"], data, headers=self.headers
                )
                soup = BeautifulSoup(resp.text, "lxml")

                parser = getattr(self, config["parser"])
                leads = parser(soup, config)

                if not leads:
                    self.logger.warning("No leads returned from query.")
                else:
                    all_leads.extend(leads)
            except Exception as e:
                self.logger.error(f"{county_key} query failed: {e}")

        return all_leads

    # region county parsers

    def _parse_broward(self, soup: BeautifulSoup, config: dict) -> list[MarriageLead]:
        leads = []

        script_tag = soup.find("script", string=re.compile("ML-"))  # type: ignore
        if script_tag:
            match = re.search(r'var array = "\\"(.*)""', script_tag.string)

            if match:
                try:
                    raw_data = rf"{match.group(1)}"
                    cleaned_data = raw_data.replace("\\", "")
                    license_json = json.loads(cleaned_data)
                except Exception as e:
                    self.logger.error(f"Unable to parse raw json string response: {e}")
                    return []

                for result in license_json:
                    lead = MarriageLead()

                    # lead objects structure
                    """
                    {
                        'ID': 000000,
                        'APPNUM': "ML-SO-2026-000000",
                        'STATUS': "MARRIED*",
                        'CEREMONY_DATE': "01-01-2026",
                        'GFN': 'BRANDON', 
                        'GMN': 'CHASE', 
                        'GLN': 'RICHMOND', 
                        'GSurName': '', 
                        'GDOB': '06-11-1991', 
                        'BFN': 'SANDIE', 
                        'BMN': '', 
                        'BLN': 'BEDEJUSTE', 
                        'BDOB': '01-31-1995', 
                        'BSurName': '', 
                        'SpouseNames': 'BRANDON CHASE RICHMOND u003cbr /u003eSANDIE  BEDEJUSTE'
                    }
                    """

                    lead.source = config["name"]
                    lead.source_url = config["search_url"]

                    lead.spouse1_first = result.get("GFN")
                    lead.spouse1_middle = result.get("GMN")
                    lead.spouse1_last = result.get("GLN")
                    lead.spouse1_dob = result.get("GDOB")

                    lead.spouse2_first = result.get("BFN")
                    lead.spouse2_middle = result.get("BMN")
                    lead.spouse2_last = result.get("BLN")
                    lead.spouse2_dob = result.get("BDOB")

                    lead.license_number = result.get("APPNUM")
                    lead.wedding_date = result.get("CEREMONY_DATE")

                    if lead.is_hit:
                        lead.score = lead.calculateScore()
                        leads.append(lead)

        return leads

    # endregion county parsers
