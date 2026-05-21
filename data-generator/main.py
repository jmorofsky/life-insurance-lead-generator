import logging, os, configparser
from datetime import datetime
from scrapers.marriage_scraper import MarriageLicenseScraper

config = configparser.ConfigParser()
config.read("appconfig.cfg")

filename = datetime.now().strftime("%Y%m%d_%H%M%S.log")
logger = logging.getLogger(__name__)


def main():
    logging.basicConfig(
        filename=os.path.join(config["Logging"]["logPath"], filename),
        level=config["Logging"]["logLevel"],
    )

    marriage = MarriageLicenseScraper()
    marriage_leads = marriage.fetch()


if __name__ == "__main__":
    main()
