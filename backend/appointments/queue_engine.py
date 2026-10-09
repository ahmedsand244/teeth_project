"""
Queue Engine for DentFlow
Allocates sequential queue numbers starting from 1.
"""

from typing import Set


def get_next_queue_number(visit_type: str = '', taken_tokens: Set[int] = None) -> int:
    """
    Allocates the lowest available token number starting from 1.
    """
    if taken_tokens is None:
        taken_tokens = set()
    candidate = 1
    while candidate in taken_tokens:
        candidate += 1
    return candidate

