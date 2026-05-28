import logging, os, configparser
from datetime import datetime
from scrapers.marriage_scraper import MarriageLicenseScraper
from db import DbConnection

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

    marriage_leads_list = [lead.to_dict() for lead in marriage_leads]
    stmt = marriage_leads[0].generate_insert_sql()

    logger.info(f"Inserting {len(marriage_leads_list)} leads into DB.")
    db = DbConnection()
    db.execute_many(stmt, marriage_leads_list)


if __name__ == "__main__":
    main()
