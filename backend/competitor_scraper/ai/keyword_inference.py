import spacy
from collections import Counter
import math

class KeywordInferenceEngine:
    """NLP-based keyword inference using spaCy."""

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("[NLP] spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None

    def infer_keywords(self, ads: list) -> list:
        if not self.nlp:
            return self._fallback_keywords(ads)

        texts = [f"{a.get('headline','')} {a.get('description','')} {a.get('ctaText','')}" for a in ads]
        all_tokens = []

        for doc in self.nlp.pipe(texts, disable=["ner"]):
            tokens = [
                t.lemma_.lower() for t in doc
                if not t.is_stop and not t.is_punct and len(t.text) > 2 and t.pos_ in ("NOUN", "VERB", "ADJ")
            ]
            all_tokens.extend(tokens)

        # Build bi-grams
        bigrams = [f"{all_tokens[i]} {all_tokens[i+1]}" for i in range(len(all_tokens)-1)]
        freq = Counter(all_tokens + bigrams)
        max_freq = max(freq.values(), default=1)

        keywords = []
        for i, (term, count) in enumerate(freq.most_common(30)):
            score = count / max_freq
            keywords.append({
                "id": f"kw_{i}",
                "keyword": term,
                "frequency": count,
                "relevanceScore": round(score, 2),
                "intent": self._classify_intent(term),
                "sourceAds": [a["id"] for a in ads if term.split()[0] in a.get("headline","").lower()][:3],
            })
        return keywords

    def _classify_intent(self, keyword: str) -> str:
        transactional = ["buy", "shop", "order", "purchase", "get", "deal", "discount", "offer"]
        navigational = ["brand", "official", "store", "website", "online"]
        informational = ["how", "what", "why", "guide", "tips", "best"]
        if any(w in keyword for w in transactional): return "transactional"
        if any(w in keyword for w in navigational): return "navigational"
        if any(w in keyword for w in informational): return "informational"
        return "commercial"

    def _fallback_keywords(self, ads: list) -> list:
        """Simple fallback when spaCy is unavailable."""
        import re
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with"}
        all_words = []
        for ad in ads:
            text = f"{ad.get('headline','')} {ad.get('description','')}".lower()
            words = [w for w in re.findall(r'\b\w{3,}\b', text) if w not in stop_words]
            all_words.extend(words)
        freq = Counter(all_words)
        return [
            {"id": f"kw_{i}", "keyword": term, "frequency": count,
             "relevanceScore": round(count / max(freq.values(), default=1), 2),
             "intent": self._classify_intent(term), "sourceAds": []}
            for i, (term, count) in enumerate(freq.most_common(20))
        ]
