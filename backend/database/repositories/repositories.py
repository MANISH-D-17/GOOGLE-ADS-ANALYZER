"""
Repositories — Data Access Layer for Competitor Intelligence
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import (
    Competitor, ScrapeSession, ScrapedAd, ScrapedImage, InferredKeyword,
    CreativeAnalysis, EmotionalAnalysis, ColorAnalysis, CTAAnalysis,
    CompetitorSnapshot, BenchmarkReport, AIRecommendation
)


class CompetitorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, domain: str, brand_name: str, region: str = "IN") -> Competitor:
        result = await self.db.execute(select(Competitor).where(Competitor.domain == domain))
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        competitor = Competitor(
            id=str(uuid.uuid4()), domain=domain,
            brand_name=brand_name, region=region,
            first_scraped=datetime.utcnow(), last_scraped=datetime.utcnow()
        )
        self.db.add(competitor)
        await self.db.flush()
        return competitor

    async def update_last_scraped(self, competitor_id: str, ads_count: int):
        result = await self.db.execute(select(Competitor).where(Competitor.id == competitor_id))
        c = result.scalar_one_or_none()
        if c:
            c.last_scraped = datetime.utcnow()
            c.total_ads_seen = (c.total_ads_seen or 0) + ads_count

    async def list_all(self) -> list[Competitor]:
        result = await self.db.execute(select(Competitor).where(Competitor.is_active == True))
        return list(result.scalars().all())

    async def get_by_id(self, cid: str) -> Optional[Competitor]:
        result = await self.db.execute(select(Competitor).where(Competitor.id == cid))
        return result.scalar_one_or_none()

    async def get_by_domain(self, domain: str) -> Optional[Competitor]:
        result = await self.db.execute(select(Competitor).where(Competitor.domain == domain))
        return result.scalar_one_or_none()


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, competitor_id: str, session_key: str, region: str = "IN") -> ScrapeSession:
        session = ScrapeSession(
            id=str(uuid.uuid4()), competitor_id=competitor_id,
            session_key=session_key, region=region, status="running",
            started_at=datetime.utcnow()
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def complete(self, session_id: str, ads_count: int, images: int, errors: int):
        result = await self.db.execute(select(ScrapeSession).where(ScrapeSession.id == session_id))
        s = result.scalar_one_or_none()
        if s:
            s.status = "complete"
            s.ads_extracted = ads_count
            s.images_found = images
            s.errors_count = errors
            s.progress = 100
            s.completed_at = datetime.utcnow()

    async def get_by_key(self, key: str) -> Optional[ScrapeSession]:
        result = await self.db.execute(select(ScrapeSession).where(ScrapeSession.session_key == key))
        return result.scalar_one_or_none()

    async def list_by_competitor(self, competitor_id: str, limit: int = 10) -> list[ScrapeSession]:
        result = await self.db.execute(
            select(ScrapeSession)
            .where(ScrapeSession.competitor_id == competitor_id)
            .order_by(desc(ScrapeSession.started_at))
            .limit(limit)
        )
        return list(result.scalars().all())


class AdRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert(self, ad_data: dict, session_id: str, competitor_id: str) -> ScrapedAd:
        # Check by content hash
        result = await self.db.execute(
            select(ScrapedAd).where(
                ScrapedAd.session_id == session_id,
                ScrapedAd.content_hash == ad_data.get("contentHash", "")
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        ad = ScrapedAd(
            id=str(uuid.uuid4()),
            session_id=session_id,
            competitor_id=competitor_id,
            external_ad_id=ad_data.get("id", ""),
            content_hash=ad_data.get("contentHash", str(uuid.uuid4())[:8]),
            brand=ad_data.get("brand", ""),
            domain=ad_data.get("domain", ""),
            headline=ad_data.get("headline", ""),
            description=ad_data.get("description", ""),
            cta_text=ad_data.get("ctaText", ""),
            landing_url=ad_data.get("landingUrl", ""),
            ad_format=ad_data.get("adFormat", "image"),
            creative_type=ad_data.get("creativeType", ""),
            fashion_category=ad_data.get("fashionCategory", ""),
            offer_text=ad_data.get("offerText", ""),
            emotional_triggers=ad_data.get("emotionalTriggers", []),
            product_mentions=ad_data.get("productMentions", []),
            dominant_colors=ad_data.get("dominantColors", []),
            first_seen=ad_data.get("firstSeen", ""),
            last_seen=ad_data.get("lastSeen", ""),
            source_url=ad_data.get("sourceUrl", ""),
            extracted_at=datetime.utcnow(),
        )
        self.db.add(ad)
        await self.db.flush()
        return ad

    async def list_by_competitor(self, competitor_id: str, limit: int = 100, offset: int = 0) -> list[ScrapedAd]:
        result = await self.db.execute(
            select(ScrapedAd)
            .where(ScrapedAd.competitor_id == competitor_id)
            .order_by(desc(ScrapedAd.created_at))
            .limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    async def get_stats(self, competitor_id: str) -> dict:
        total = await self.db.scalar(select(func.count()).where(ScrapedAd.competitor_id == competitor_id))
        images = await self.db.scalar(
            select(func.count()).where(ScrapedAd.competitor_id == competitor_id, ScrapedAd.ad_format == "image")
        )
        avg_score = await self.db.scalar(
            select(func.avg(ScrapedAd.composite_score)).where(ScrapedAd.competitor_id == competitor_id)
        )
        return {
            "total_ads": total or 0,
            "image_ads": images or 0,
            "avg_score": round(float(avg_score or 0), 1),
        }


class KeywordRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def bulk_insert(self, keywords: list[dict], ad_id: str, competitor_id: str, session_id: str):
        for kw in keywords:
            obj = InferredKeyword(
                id=str(uuid.uuid4()),
                ad_id=ad_id,
                competitor_id=competitor_id,
                session_id=session_id,
                keyword=kw.get("keyword", ""),
                frequency=kw.get("frequency", 1),
                relevance_score=kw.get("relevanceScore", 0.0),
                intent=kw.get("intent", "commercial"),
            )
            self.db.add(obj)

    async def get_top_by_competitor(self, competitor_id: str, limit: int = 30) -> list[dict]:
        result = await self.db.execute(
            select(
                InferredKeyword.keyword,
                func.sum(InferredKeyword.frequency).label("total_freq"),
                func.avg(InferredKeyword.relevance_score).label("avg_relevance"),
                InferredKeyword.intent
            )
            .where(InferredKeyword.competitor_id == competitor_id)
            .group_by(InferredKeyword.keyword, InferredKeyword.intent)
            .order_by(desc("total_freq"))
            .limit(limit)
        )
        rows = result.all()
        return [
            {"keyword": r.keyword, "frequency": r.total_freq,
             "relevanceScore": round(float(r.avg_relevance), 2), "intent": r.intent}
            for r in rows
        ]


class AnalysisRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def insert_creative(self, ad_id: str, data: dict):
        obj = CreativeAnalysis(id=str(uuid.uuid4()), ad_id=ad_id, **data)
        self.db.add(obj)

    async def insert_emotional(self, ad_id: str, data: dict):
        obj = EmotionalAnalysis(id=str(uuid.uuid4()), ad_id=ad_id, **data)
        self.db.add(obj)

    async def insert_color(self, ad_id: str, data: dict):
        obj = ColorAnalysis(id=str(uuid.uuid4()), ad_id=ad_id, **data)
        self.db.add(obj)

    async def insert_cta(self, ad_id: str, data: dict):
        obj = CTAAnalysis(id=str(uuid.uuid4()), ad_id=ad_id, **data)
        self.db.add(obj)


class BenchmarkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, competitor_id: str, data: dict) -> BenchmarkReport:
        report = BenchmarkReport(id=str(uuid.uuid4()), competitor_id=competitor_id, **data)
        self.db.add(report)
        await self.db.flush()
        return report

    async def get_latest(self, competitor_id: str) -> Optional[BenchmarkReport]:
        result = await self.db.execute(
            select(BenchmarkReport)
            .where(BenchmarkReport.competitor_id == competitor_id)
            .order_by(desc(BenchmarkReport.report_date))
            .limit(1)
        )
        return result.scalar_one_or_none()


class RecommendationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def bulk_insert(self, competitor_id: str, session_id: str, recs: list[dict]):
        for r in recs:
            obj = AIRecommendation(
                id=str(uuid.uuid4()),
                competitor_id=competitor_id,
                session_id=session_id,
                recommendation_type=r.get("type", "general"),
                title=r.get("title", ""),
                description=r.get("description", ""),
                action_items=r.get("actionItems", []),
                priority=r.get("priority", "medium"),
                impact_score=r.get("impactScore", 0.5),
            )
            self.db.add(obj)

    async def get_by_competitor(self, competitor_id: str, limit: int = 10) -> list[AIRecommendation]:
        result = await self.db.execute(
            select(AIRecommendation)
            .where(AIRecommendation.competitor_id == competitor_id)
            .order_by(desc(AIRecommendation.impact_score))
            .limit(limit)
        )
        return list(result.scalars().all())
