"""
Keyword Inference Engine
Infers keywords from competitor ad copy using NLP (spaCy)
"""
import re
from collections import Counter
import spacy
from typing import List, Dict

class KeywordInferenceEngine:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            # Fallback if model not downloaded
            self.nlp = None
            print("[NLP] Warning: spacy model 'en_core_web_sm' not found. Keyword inference will use basic tokenization.")

    def infer_keywords(self, ads: List[Dict]) -> List[Dict]:
        """
        Extract and score keywords from a list of scraped ads.
        """
        all_text = []
        for ad in ads:
            text = f"{ad.get('headline', '')} {ad.get('description', '')}"
            all_text.append(text)
        
        full_text = " ".join(all_text).lower()
        
        # Clean text
        full_text = re.sub(r'[^\w\s]', '', full_text)
        
        keywords_data = []
        
        if self.nlp:
            doc = self.nlp(full_text)
            # Filter for nouns, adjectives, and proper nouns
            tokens = [token.text for token in doc if not token.is_stop and token.pos_ in ["NOUN", "PROPN", "ADJ"] and len(token.text) > 2]
            counts = Counter(tokens)
            
            total_tokens = len(tokens)
            for word, count in counts.most_common(50):
                # Basic relevance score based on frequency and token type
                # We can also check if the word is present in many different ads
                ad_presence = sum(1 for ad in ads if word in f"{ad.get('headline', '')} {ad.get('description', '')}".lower())
                relevance = (count / (total_tokens + 1)) * 10 + (ad_presence / len(ads)) * 5
                
                intent = self._determine_intent(word)
                
                keywords_data.append({
                    "keyword": word,
                    "frequency": count,
                    "relevanceScore": round(min(relevance, 10.0), 2),
                    "intent": intent
                })
        else:
            # Basic fallback logic
            stop_words = {"the", "and", "for", "with", "from", "this", "that", "your", "our"}
            tokens = [word for word in full_text.split() if word not in stop_words and len(word) > 3]
            counts = Counter(tokens)
            
            for word, count in counts.most_common(50):
                keywords_data.append({
                    "keyword": word,
                    "frequency": count,
                    "relevanceScore": 5.0, # Neutral score
                    "intent": self._determine_intent(word)
                })
                
        return keywords_data

    def _determine_intent(self, word: str) -> str:
        commercial = ["buy", "shop", "order", "price", "off", "sale", "discount", "offer"]
        informational = ["how", "what", "guide", "tips", "style", "color", "material"]
        
        if any(w in word for w in commercial):
            return "commercial"
        if any(w in word for w in informational):
            return "informational"
        return "transactional" if len(word) < 6 else "commercial"
