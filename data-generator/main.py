import logging, os, sys, json
from datetime import datetime
from scrapers.marriage_scraper import MarriageLicenseScraper
from db import DbConnection
from utilities import get_config

config = get_config()

filename = datetime.now().strftime("%Y%m%d_%H%M%S.log")
logger = logging.getLogger(__name__)


def main():
    # read input from stdin (sent by Electron)
    input_data = json.loads(sys.stdin.read())
    user_data_path = input_data["userDataPath"]

    log_path = os.path.join(user_data_path, "logs", filename)
    log_dir = os.path.dirname(log_path)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)

    logging.basicConfig(
        filename=log_path,
        level=config["Logging"]["logLevel"],
    )

    marriage = MarriageLicenseScraper()
    marriage_leads = marriage.fetch()

    marriage_leads_list = [lead.to_dict() for lead in marriage_leads]

    if len(marriage_leads_list):
        stmt = marriage_leads[0].generate_insert_sql()

        logger.info(f"Inserting {len(marriage_leads_list)} leads into DB.")
        db = DbConnection()
        db.execute_many(stmt, marriage_leads_list)
    else:
        logger.info("No marriage leads to insert.")

    sys.exit(0)


if __name__ == "__main__":
    main()
