from datetime import datetime, timezone
from typing import Optional

# Global timestamp for the last reset
DETECTION_RESET_AT: Optional[datetime] = None
RESET_COOLDOWN_SECONDS = 30  # demo-only

def reset_detection_state():
    global DETECTION_RESET_AT
    DETECTION_RESET_AT = datetime.now(timezone.utc)

def get_detection_reset_time() -> Optional[datetime]:
    return DETECTION_RESET_AT
