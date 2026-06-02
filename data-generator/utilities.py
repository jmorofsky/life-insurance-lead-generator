import os, sys, configparser


def get_path(relative_path: str) -> str:
    """
    :param relative_path:
    :rtype: str
    :returns: absolute path to a resource, for either running script locally,
    or through pyinstaller version from GUI
    """
    if getattr(sys, "freeze", False) and hasattr(sys, "_MEIPASS"):
        # PyInstaller unpacks data to the temporary folder sys._MEIPASS
        return os.path.join(sys._MEIPASS, relative_path)  # type: ignore
    else:
        # local path
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), relative_path)


def get_config() -> configparser.ConfigParser:
    config = configparser.ConfigParser()
    config_path = get_path("appconfig.cfg")
    config.read(config_path)

    return config
