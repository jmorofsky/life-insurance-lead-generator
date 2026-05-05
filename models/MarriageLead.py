import uuid
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MarriageLead:
    """
    Normalized marriage lead record, sourced from a public license index.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source: str = ""
    source_url: str = ""

    # Person 1
    spouse1_first: Optional[str] = None
    spouse1_middle: Optional[str] = None
    spouse1_last: Optional[str] = None
    spouse1_dob: Optional[str] = None

    # Person 2
    spouse2_first: Optional[str] = None
    spouse2_middle: Optional[str] = None
    spouse2_last: Optional[str] = None
    spouse2_dob: Optional[str] = None

    married_last_name: Optional[str] = None  # shared last name after marriage

    # Event details
    license_date: Optional[str] = None
    license_number: Optional[str] = None
    wedding_date: Optional[str] = None
    wedding_county: Optional[str] = None
    wedding_state: Optional[str] = None

    # Metadata
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    score: float = 0.0

    def is_hit(self):
        if (self.spouse1_last and self.spouse1_first) or (
            self.spouse2_last and self.spouse2_first
        ):
            return True

        return False

    def calculateScore(self):
        # start with a base of 0.90; newlyweds are top-tier prospects
        score = 0.90

        if self.spouse1_first and self.spouse1_last:
            score += 0.04
        if self.spouse2_first and self.spouse2_last:
            score += 0.04

        if self.spouse1_dob or self.spouse2_dob:
            score += 0.02

        if self.wedding_date or self.license_date:
            score += 0.01

        return round(min(score, 1.0), 2)
