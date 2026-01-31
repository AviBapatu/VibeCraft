from datetime import datetime
from typing import Optional

# Global timestamp for the last reset
# Using a list to allow modification in closures/imports if needed, 
# but direct variable access is fine too if imported locally.
# We'll use a simple variable and a getter/setter function pattern 
# or just a direct variable. A variable is simplest if imported effectively.
# Actually, to avoid "global" keyword mess in other files, let's keep it simple.

_DETECTION_RESET_AT: Optional[datetime] = None

def reset_detection_state():
    global _DETECTION_RESET_AT
    _DETECTION_RESET_AT = datetime.utcnow()

def get_detection_reset_time() -> Optional[datetime]:
    return _DETECTION_RESET_AT
