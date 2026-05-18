"""
Storage Pipeline Service
Orchestrates: scraper output → PostgreSQL storage → analysis → recommendations
"""
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from database.repositories.repositories import (
    CompetitorRepository, SessionRepository, AdRepository,
    KeywordRepository, AnalysisRepository, BenchmarkRepository, RecommendationRepository
)
from competitor_analysis.ai.keyword_inference import KeywordInferenceEngine
from competitor_analysis.scoring.creative_scorer import CreativeScorer
from competitor_analysis.comparison.benchmark import BenchmarkEngine
from competitor_analysis.reports.recommendations import RecommendationEngine
from competitor_analysis.keyword_pipeline.enricher import KeywordEnricher


class StoragePipelineService:
    """
    Entry point: call pipeline.store(session_id, domain, ads) after scraping.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.nlp = KeywordInferenceEngine()
        self.scorer = CreativeScorer()
        self.benchmark = BenchmarkEngine()
        self.rec_engine = RecommendationEngine()

    async def store(self, session_key: str, domain: str, region: str, ads: list[dict]) -> dict:
        """Full pipeline: store + analyse + recommend."""
        competitor_repo = CompetitorRepository(self.db)
        session_repo = SessionRepository(self.db)
        ad_repo = AdRepository(self.db)
        kw_repo = KeywordRepository(self.db)
        analysis_repo = AnalysisRepository(self.db)
        rec_repo = RecommendationRepository(self.db)

        # 1. Upsert competitor
        brand = domain.split(".")[0].replace("-", " ").title()
        competitor = await competitor_repo.get_or_create(domain, brand, region)

        # 2. Create session record
        session = await session_repo.create(competitor.id, session_key, region)

        stored_ads = []
        for ad_data in ads:
            # 3. Store ad
            ad = await ad_repo.upsert(ad_data, session.id, competitor.id)
            stored_ads.append(ad)

            # 4. Score ad
            scores = self.scorer.score(ad_data)
            ad.creative_score = scores["creative_score"]
            ad.emotional_score = scores["emotional_score"]
            ad.cta_score = scores["cta_score"]
            ad.visual_score = scores["visual_score"]
            ad.keyword_strength = scores["keyword_strength"]
            ad.composite_score = scores["composite_score"]

            # 5. Store images
            for img_url in ad_data.get("imageUrls", []):
                from database.models import ScrapedImage
                img = ScrapedImage(
                    id=str(uuid.uuid4()),
                    ad_id=ad.id,
                    image_url=img_url,
                )
                self.db.add(img)

            # 6. Analysis records
            await analysis_repo.insert_creative(ad.id, self._creative_analysis(ad_data, scores))
            await analysis_repo.insert_emotional(ad.id, self._emotional_analysis(ad_data, scores))
            await analysis_repo.insert_color(ad.id, self._color_analysis(ad_data))
            await analysis_repo.insert_cta(ad.id, self._cta_analysis(ad_data, scores))

        # 7. NLP keyword inference across all ads
        keywords = self.nlp.infer_keywords(ads)
        kw_terms = [k["keyword"] for k in keywords[:15]]
        
        # Enrichment via DataForSEO
        enricher = KeywordEnricher(self.db)
        await enricher.enrich_keywords(kw_terms)
        
        for ad in stored_ads:
            await kw_repo.bulk_insert(keywords[:10], ad.id, competitor.id, session.id)

        # 8. Benchmark
        benchmark_data = self.benchmark.compare(ads)
        await BenchmarkRepository(self.db).create(competitor.id, benchmark_data)

        # 9. AI Recommendations
        recommendations = self.rec_engine.generate(ads, benchmark_data, keywords)
        await rec_repo.bulk_insert(competitor.id, session.id, recommendations)

        # 10. Complete session
        images_count = sum(len(a.get("imageUrls", [])) for a in ads)
        await session_repo.complete(session.id, len(ads), images_count, 0)
        await competitor_repo.update_last_scraped(competitor.id, len(ads))

        await self.db.commit()

        return {
            "competitor_id": competitor.id,
            "session_id": session.id,
            "ads_stored": len(stored_ads),
            "keywords_inferred": len(keywords),
            "recommendations": len(recommendations),
        }

    def _creative_analysis(self, ad: dict, scores: dict) -> dict:
        return {
            "has_offer": bool(ad.get("offerText")),
            "has_product_image": len(ad.get("imageUrls", [])) > 0,
            "layout_type": "image_with_text" if ad.get("imageUrls") else "text_only",
            "brand_prominence": "high",
            "creative_score": scores["creative_score"],
        }

    def _emotional_analysis(self, ad: dict, scores: dict) -> dict:
        triggers = ad.get("emotionalTriggers", [])
        return {
            "emotion_tags": triggers,
            "primary_emotion": triggers[0] if triggers else "neutral",
            "urgency_level": "high" if "urgency" in triggers else "low",
            "aspiration_score": 0.7 if "style" in triggers else 0.4,
            "trust_score": 0.8 if "trust" in triggers else 0.5,
            "excitement_score": 0.6 if "exclusivity" in triggers else 0.3,
            "emotional_score": scores["emotional_score"],
        }

    def _color_analysis(self, ad: dict) -> dict:
        colors = ad.get("dominantColors", ["#f97316", "#ffffff"])
        return {
            "dominant_colors": colors,
            "background_color": colors[1] if len(colors) > 1 else "#ffffff",
            "accent_color": colors[0] if colors else "#f97316",
            "color_temperature": "warm",
            "palette_type": "brand",
            "contrast_score": 0.75,
        }

    def _cta_analysis(self, ad: dict, scores: dict) -> dict:
        cta = ad.get("ctaText", "Shop Now")
        urgency_words = [w for w in ["now", "today", "limited", "hurry"] if w in cta.lower()]
        return {
            "cta_text": cta,
            "cta_style": "urgency" if urgency_words else "neutral",
            "action_verb": cta.split()[0] if cta else "Shop",
            "urgency_words": urgency_words,
            "cta_score": scores["cta_score"],
        }
