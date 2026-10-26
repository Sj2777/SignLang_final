# app/isl_translator.py
"""
HandSpeak - Backend ISL Grammar and Translation Module
Integrates the ISLTranslate dataset vocabulary & Indian Sign Language grammatical rules (SOV reordering, question word inversion, stopword elimination).
"""

import re
from typing import List, Dict, Any

ISL_WORDS_LEXICON = {
    "HELLO": {"word": "HELLO", "sign": "Namaskar", "marathi": "नमस्कार", "phonetic": "Namaskar"},
    "NAMASTE": {"word": "NAMASTE", "sign": "Namaskar", "marathi": "नमस्कार", "phonetic": "Namaskar"},
    "NAMASKAR": {"word": "NAMASKAR", "sign": "Namaskar", "marathi": "नमस्कार", "phonetic": "Namaskar"},
    "THANK": {"word": "THANK YOU", "sign": "Dhanyawad", "marathi": "धन्यवाद", "phonetic": "Dhanyawaad"},
    "THANKS": {"word": "THANK YOU", "sign": "Dhanyawad", "marathi": "धन्यवाद", "phonetic": "Dhanyawaad"},
    "WELCOME": {"word": "WELCOME", "sign": "Swagat", "marathi": "स्वागत", "phonetic": "Swaagat"},
    "PLEASE": {"word": "PLEASE", "sign": "Krupaya", "marathi": "कृपया", "phonetic": "Krupaya"},
    "SORRY": {"word": "SORRY", "sign": "Kshama", "marathi": "माफ करा", "phonetic": "Maaf Kara"},
    "YES": {"word": "YES", "sign": "Ho", "marathi": "हो", "phonetic": "Ho"},
    "NO": {"word": "NO", "sign": "Nahi", "marathi": "नाही", "phonetic": "Naahi"},
    "HELP": {"word": "HELP", "sign": "Madat", "marathi": "मदत", "phonetic": "Madat"},
    "MADAT": {"word": "HELP", "sign": "Madat", "marathi": "मदत", "phonetic": "Madat"},
    "HOSPITAL": {"word": "HOSPITAL", "sign": "Dawakhana", "marathi": "दवाखाना", "phonetic": "Dawakhana"},
    "DAWAKHANA": {"word": "HOSPITAL", "sign": "Dawakhana", "marathi": "दवाखाना", "phonetic": "Dawakhana"},
    "POLICE": {"word": "POLICE", "sign": "Police", "marathi": "पोलीस", "phonetic": "Police"},
    "DOCTOR": {"word": "DOCTOR", "sign": "Doctor", "marathi": "डॉक्टर", "phonetic": "Doctor"},
    "WATER": {"word": "WATER", "sign": "Pani", "marathi": "पाणी", "phonetic": "Paani"},
    "PANI": {"word": "WATER", "sign": "Pani", "marathi": "पाणी", "phonetic": "Paani"},
    "FOOD": {"word": "FOOD", "sign": "Jevan", "marathi": "जेवण", "phonetic": "Jevan"},
    "JEVAN": {"word": "FOOD", "sign": "Jevan", "marathi": "जेवण", "phonetic": "Jevan"},
    "PUNE": {"word": "PUNE", "sign": "Pune", "marathi": "पुणे", "phonetic": "Pune"},
    "SCHOOL": {"word": "SCHOOL", "sign": "Shala", "marathi": "शाळा", "phonetic": "Shaala"},
    "TIME": {"word": "TIME", "sign": "Vel", "marathi": "वेळ", "phonetic": "Vel"},
    "I": {"word": "I / ME", "sign": "I", "marathi": "मी", "phonetic": "Mee"},
    "ME": {"word": "I / ME", "sign": "I", "marathi": "मी", "phonetic": "Mee"},
    "MY": {"word": "MY", "sign": "My", "marathi": "माझे", "phonetic": "Maajhe"},
    "YOU": {"word": "YOU", "sign": "You", "marathi": "तुम्ही / तू", "phonetic": "Tumhi"},
    "YOUR": {"word": "YOUR", "sign": "Your", "marathi": "तुमचे", "phonetic": "Tumche"},
    "NAME": {"word": "NAME", "sign": "Nav", "marathi": "नाव", "phonetic": "Naav"},
}

ISL_STOP_WORDS = {
    "IS", "AM", "ARE", "WAS", "WERE", "BE", "BEEN", "BEING",
    "THE", "A", "AN",
    "TO", "OF", "FOR", "IN", "ON", "AT", "BY", "WITH", "FROM"
}

ISL_QUESTION_WORDS = {
    "WHAT", "WHERE", "WHEN", "WHY", "WHO", "WHOM", "WHOSE", "WHICH", "HOW"
}

ISL_DIGITS = {
    "0": {"english": "0 (Zero)", "marathi": "० (शून्य)", "phonetic": "Shoonya"},
    "1": {"english": "1 (One)", "marathi": "१ (एक)", "phonetic": "Ek"},
    "2": {"english": "2 (Two)", "marathi": "२ (दोन)", "phonetic": "Don"},
    "3": {"english": "3 (Three)", "marathi": "३ (तीन)", "phonetic": "Teen"},
    "4": {"english": "4 (Four)", "marathi": "४ (चार)", "phonetic": "Chaar"},
    "5": {"english": "5 (Five)", "marathi": "५ (पाच)", "phonetic": "Paach"},
    "6": {"english": "6 (Six)", "marathi": "६ (सहा)", "phonetic": "Saha"},
    "7": {"english": "7 (Seven)", "marathi": "७ (सात)", "phonetic": "Saat"},
    "8": {"english": "8 (Eight)", "marathi": "८ (आठ)", "phonetic": "Aath"},
    "9": {"english": "9 (Nine)", "marathi": "९ (नऊ)", "phonetic": "Naoo"},
}

def translate_text_to_isl(text: str, mode: str = "grammar") -> Dict[str, Any]:
    if not text:
        return {"original_text": "", "isl_gloss": "", "tokens": []}

    cleaned = text.upper()
    raw_words = re.findall(r'[A-Z0-9]+', cleaned)

    if mode == "fingerspell":
        tokens = []
        for word in raw_words:
            for ch in word:
                if ch.isdigit():
                    info = ISL_DIGITS.get(ch, {})
                    tokens.append({
                        "type": "number",
                        "token": ch,
                        "display": ch,
                        "marathi": info.get("marathi", ch),
                        "phonetic": info.get("phonetic", ch),
                        "image_url": f"/assets/signs/{ch}.png"
                    })
                else:
                    tokens.append({
                        "type": "letter",
                        "token": ch,
                        "display": ch,
                        "marathi": f"अक्षर {ch}",
                        "phonetic": ch,
                        "image_url": f"/assets/signs/{ch.lower()}.png"
                    })
            tokens.append({"type": "space", "token": "SPACE", "display": "[ SPACE ]"})
        if tokens and tokens[-1]["type"] == "space":
            tokens.pop()
        return {
            "original_text": text,
            "isl_gloss": " ".join(raw_words),
            "tokens": tokens
        }

    # ISL SOV syntax reordering
    regular = []
    questions = []
    negations = []
    for w in raw_words:
        if w in ISL_QUESTION_WORDS:
            questions.append(w)
        elif w in ("NOT", "NO"):
            negations.append(w)
        elif w not in ISL_STOP_WORDS:
            regular.append(w)

    isl_gloss_words = regular + negations + questions
    if not isl_gloss_words:
        isl_gloss_words = raw_words

    tokens = []
    for idx, word in enumerate(isl_gloss_words):
        if word in ISL_WORDS_LEXICON:
            entry = ISL_WORDS_LEXICON[word]
            tokens.append({
                "type": "word",
                "token": entry["word"],
                "display": entry["word"],
                "marathi": entry["marathi"],
                "phonetic": entry["phonetic"],
                "image_url": None
            })
        elif word.isdigit():
            for d in word:
                info = ISL_DIGITS.get(d, {})
                tokens.append({
                    "type": "number",
                    "token": d,
                    "display": d,
                    "marathi": info.get("marathi", d),
                    "phonetic": info.get("phonetic", d),
                    "image_url": f"/assets/signs/{d}.png"
                })
        else:
            for ch in word:
                tokens.append({
                    "type": "letter",
                    "token": ch,
                    "display": ch,
                    "marathi": f"अक्षर {ch}",
                    "phonetic": ch,
                    "image_url": f"/assets/signs/{ch.lower()}.png"
                })
        if idx < len(isl_gloss_words) - 1:
            tokens.append({"type": "space", "token": "SPACE", "display": "[ SPACE ]"})

    return {
        "original_text": text,
        "isl_gloss": " ".join(isl_gloss_words),
        "tokens": tokens
    }
