import re

# Basic Regex patterns for sensitive PII
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d[ -]*?){13,16}\b')

def scrub_pii(text: str) -> str:
    """
    Scrub common PII (Email, Phone, SSN, Credit Card) from text before sending to LLM.
    Uses regex for speed in the MVP phase.
    """
    if not text:
        return text

    # Mask SSNs first
    text = SSN_REGEX.sub('[SSN MASKED]', text)
    # Mask Credit Cards
    text = CREDIT_CARD_REGEX.sub('[CREDIT CARD MASKED]', text)
    # Mask Emails
    text = EMAIL_REGEX.sub('[EMAIL MASKED]', text)
    # Mask Phones
    text = PHONE_REGEX.sub('[PHONE MASKED]', text)

    return text
