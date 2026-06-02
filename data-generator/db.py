import os, logging, sqlite3
from platformdirs import user_data_dir
from utilities import get_config

config = get_config()

APP_NAME = config["GUI"]["app_name"]


class DbConnection:
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.db_dir = user_data_dir(appname=APP_NAME, appauthor=False, roaming=True)
        self.db_path = os.path.join(self.db_dir, "database.db")

    def _get_connection(self):
        if not os.path.isfile(self.db_path):
            self.logger.critical("DB file not found.")
            raise FileNotFoundError("DB file not found.")

        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row

            return conn
        except Exception as e:
            self.logger.critical(f"Unable to establish connection to DB: {e}")
            raise ConnectionError("Unable to establish connection to DB.")

    def execute(self, query: str, params: str | list):
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(query, params)
            conn.commit()
        except Exception as e:
            self.logger.error(f"An error occurred while executing query: {e}")
            conn.rollback()
            raise RuntimeError("An error occurred while executing query.")
        finally:
            conn.close()

    def execute_many(self, query: str, params: str | list):
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.executemany(query, params)
            conn.commit()
        except Exception as e:
            self.logger.error(f"An error occurred while executing query: {e}")
            conn.rollback()
            raise RuntimeError("An error occurred while executing query.")
        finally:
            conn.close()

    def fetch_one(self, query: str, params: str | list) -> dict | None:
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(query, params)

            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            self.logger.error(f"An error occurred while executing query: {e}")
            raise RuntimeError("An error occurred while executing query.")
        finally:
            conn.close()

    def fetch_all(self, query: str, params: str | list) -> list[dict]:
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(query, params)

            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            self.logger.error(f"An error occurred while executing query: {e}")
            raise RuntimeError("An error occurred while executing query.")
        finally:
            conn.close()
