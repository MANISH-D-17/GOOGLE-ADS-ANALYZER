"""
SQLAlchemy ORM Models — All 15 Competitor Intelligence Tables
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Text, Float, Integer, Boolean, DateTime,
    ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from database.connection import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


# ────────────────────────────────────────────────────────────
# 1. competitors
# ────────────────────────────────────────────────────────────
class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    advertiser_id: Mapped[Optional[str]] = mapped_column(String(100))
    region: Mapped[str] = mapped_column(String(10), default="IN")
    category: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    first_scraped: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_scraped: Mapped[Optional[datetime]] = mapped_column(DateTime)
    total_ads_seen: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("ScrapeSession", back_populates="competitor", cascade="all, delete-orphan")
    ads = relationship("ScrapedAd", back_populates="competitor", cascade="all, delete-orphan")


# ────────────────────────────────────────────────────────────
# 2. scrape_sessions
# ────────────────────────────────────────────────────────────
class ScrapeSession(Base):
    __tablename__ = "scrape_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    session_key: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    region: Mapped[str] = mapped_column(String(10), default="IN")
    status: Mapped[str] = mapped_column(String(20), default="running")
    ads_extracted: Mapped[int] = mapped_column(Integer, default=0)
    images_found: Mapped[int] = mapped_column(Integer, default=0)
    videos_found: Mapped[int] = mapped_column(Integer, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, default=0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    raw_snapshot: Mapped[Optional[dict]] = mapped_column(JSON)

    competitor = relationship("Competitor", back_populates="sessions")
    ads = relationship("ScrapedAd", back_populates="session", cascade="all, delete-orphan")
    snapshots = relationship("CompetitorSnapshot", back_populates="session", cascade="all, delete-orphan")


# ────────────────────────────────────────────────────────────
# 3. scraped_ads
# ────────────────────────────────────────────────────────────
class ScrapedAd(Base):
    __tablename__ = "scraped_ads"
    __table_args__ = (
        UniqueConstraint("session_id", "content_hash", name="uq_session_ad"),
        Index("ix_scraped_ads_competitor", "competitor_id"),
        Index("ix_scraped_ads_format", "ad_format"),
        Index("ix_scraped_ads_category", "fashion_category"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("scrape_sessions.id"), index=True)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    external_ad_id: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)

    brand: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str] = mapped_column(String(255))
    headline: Mapped[str] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    cta_text: Mapped[Optional[str]] = mapped_column(String(100))
    landing_url: Mapped[Optional[str]] = mapped_column(Text)
    ad_format: Mapped[str] = mapped_column(String(50), default="image")
    creative_type: Mapped[Optional[str]] = mapped_column(String(50))
    fashion_category: Mapped[Optional[str]] = mapped_column(String(100))

    offer_text: Mapped[Optional[str]] = mapped_column(Text)
    emotional_triggers: Mapped[Optional[list]] = mapped_column(JSON)
    product_mentions: Mapped[Optional[list]] = mapped_column(JSON)
    dominant_colors: Mapped[Optional[list]] = mapped_column(JSON)

    first_seen: Mapped[Optional[str]] = mapped_column(String(20))
    last_seen: Mapped[Optional[str]] = mapped_column(String(20))
    source_url: Mapped[Optional[str]] = mapped_column(Text)

    creative_score: Mapped[Optional[float]] = mapped_column(Float)
    emotional_score: Mapped[Optional[float]] = mapped_column(Float)
    cta_score: Mapped[Optional[float]] = mapped_column(Float)
    visual_score: Mapped[Optional[float]] = mapped_column(Float)
    keyword_strength: Mapped[Optional[float]] = mapped_column(Float)
    composite_score: Mapped[Optional[float]] = mapped_column(Float)

    extracted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session = relationship("ScrapeSession", back_populates="ads")
    competitor = relationship("Competitor", back_populates="ads")
    images = relationship("ScrapedImage", back_populates="ad", cascade="all, delete-orphan")
    keywords = relationship("InferredKeyword", back_populates="ad", cascade="all, delete-orphan")
    creative_analysis = relationship("CreativeAnalysis", back_populates="ad", uselist=False, cascade="all, delete-orphan")
    emotional_analysis = relationship("EmotionalAnalysis", back_populates="ad", uselist=False, cascade="all, delete-orphan")
    color_analysis = relationship("ColorAnalysis", back_populates="ad", uselist=False, cascade="all, delete-orphan")
    cta_analysis = relationship("CTAAnalysis", back_populates="ad", uselist=False, cascade="all, delete-orphan")


# ────────────────────────────────────────────────────────────
# 4. scraped_images
# ────────────────────────────────────────────────────────────
class ScrapedImage(Base):
    __tablename__ = "scraped_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), index=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    local_path: Mapped[Optional[str]] = mapped_column(Text)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(Text)
    width: Mapped[Optional[int]] = mapped_column(Integer)
    height: Mapped[Optional[int]] = mapped_column(Integer)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(50))
    is_downloaded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="images")


# ────────────────────────────────────────────────────────────
# 5. scraped_videos
# ────────────────────────────────────────────────────────────
class ScrapedVideo(Base):
    __tablename__ = "scraped_videos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), index=True)
    video_url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text)
    local_path: Mapped[Optional[str]] = mapped_column(Text)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float)
    is_downloaded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 6. inferred_keywords
# ────────────────────────────────────────────────────────────
class InferredKeyword(Base):
    __tablename__ = "inferred_keywords"
    __table_args__ = (
        Index("ix_keywords_competitor", "competitor_id"),
        Index("ix_keywords_term", "keyword"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), index=True)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("scrape_sessions.id"), index=True)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False)
    frequency: Mapped[int] = mapped_column(Integer, default=1)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    intent: Mapped[str] = mapped_column(String(50), default="commercial")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="keywords")


# ────────────────────────────────────────────────────────────
# 7. creative_analysis
# ────────────────────────────────────────────────────────────
class CreativeAnalysis(Base):
    __tablename__ = "creative_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), unique=True, index=True)
    visual_complexity: Mapped[Optional[str]] = mapped_column(String(20))
    layout_type: Mapped[Optional[str]] = mapped_column(String(50))
    has_offer: Mapped[bool] = mapped_column(Boolean, default=False)
    has_product_image: Mapped[bool] = mapped_column(Boolean, default=False)
    has_lifestyle: Mapped[bool] = mapped_column(Boolean, default=False)
    brand_prominence: Mapped[Optional[str]] = mapped_column(String(20))
    typography_style: Mapped[Optional[str]] = mapped_column(String(50))
    creative_score: Mapped[float] = mapped_column(Float, default=0.0)
    analysis_notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="creative_analysis")


# ────────────────────────────────────────────────────────────
# 8. emotional_analysis
# ────────────────────────────────────────────────────────────
class EmotionalAnalysis(Base):
    __tablename__ = "emotional_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), unique=True, index=True)
    primary_emotion: Mapped[Optional[str]] = mapped_column(String(50))
    emotion_tags: Mapped[Optional[list]] = mapped_column(JSON)
    urgency_level: Mapped[Optional[str]] = mapped_column(String(20))
    aspiration_score: Mapped[float] = mapped_column(Float, default=0.0)
    trust_score: Mapped[float] = mapped_column(Float, default=0.0)
    excitement_score: Mapped[float] = mapped_column(Float, default=0.0)
    emotional_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="emotional_analysis")


# ────────────────────────────────────────────────────────────
# 9. color_analysis
# ────────────────────────────────────────────────────────────
class ColorAnalysis(Base):
    __tablename__ = "color_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), unique=True, index=True)
    dominant_colors: Mapped[Optional[list]] = mapped_column(JSON)
    background_color: Mapped[Optional[str]] = mapped_column(String(20))
    text_color: Mapped[Optional[str]] = mapped_column(String(20))
    accent_color: Mapped[Optional[str]] = mapped_column(String(20))
    color_temperature: Mapped[Optional[str]] = mapped_column(String(20))
    contrast_score: Mapped[float] = mapped_column(Float, default=0.0)
    palette_type: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="color_analysis")


# ────────────────────────────────────────────────────────────
# 10. cta_analysis
# ────────────────────────────────────────────────────────────
class CTAAnalysis(Base):
    __tablename__ = "cta_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    ad_id: Mapped[str] = mapped_column(ForeignKey("scraped_ads.id"), unique=True, index=True)
    cta_text: Mapped[Optional[str]] = mapped_column(String(100))
    cta_style: Mapped[Optional[str]] = mapped_column(String(50))
    cta_position: Mapped[Optional[str]] = mapped_column(String(50))
    urgency_words: Mapped[Optional[list]] = mapped_column(JSON)
    action_verb: Mapped[Optional[str]] = mapped_column(String(50))
    cta_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ad = relationship("ScrapedAd", back_populates="cta_analysis")


# ────────────────────────────────────────────────────────────
# 11. competitor_snapshots
# ────────────────────────────────────────────────────────────
class CompetitorSnapshot(Base):
    __tablename__ = "competitor_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("scrape_sessions.id"), index=True)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_ads: Mapped[int] = mapped_column(Integer, default=0)
    new_ads_count: Mapped[int] = mapped_column(Integer, default=0)
    removed_ads_count: Mapped[int] = mapped_column(Integer, default=0)
    changed_ads_count: Mapped[int] = mapped_column(Integer, default=0)
    ad_ids_snapshot: Mapped[Optional[list]] = mapped_column(JSON)
    diff_summary: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session = relationship("ScrapeSession", back_populates="snapshots")


# ────────────────────────────────────────────────────────────
# 12. competitor_campaigns
# ────────────────────────────────────────────────────────────
class CompetitorCampaign(Base):
    __tablename__ = "competitor_campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    campaign_name: Mapped[str] = mapped_column(String(255))
    campaign_theme: Mapped[Optional[str]] = mapped_column(String(100))
    ad_count: Mapped[int] = mapped_column(Integer, default=0)
    estimated_start: Mapped[Optional[str]] = mapped_column(String(20))
    estimated_end: Mapped[Optional[str]] = mapped_column(String(20))
    dominant_cta: Mapped[Optional[str]] = mapped_column(String(100))
    dominant_category: Mapped[Optional[str]] = mapped_column(String(100))
    offer_pattern: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 13. competitor_products
# ────────────────────────────────────────────────────────────
class CompetitorProduct(Base):
    __tablename__ = "competitor_products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    product_name: Mapped[str] = mapped_column(String(255))
    category: Mapped[Optional[str]] = mapped_column(String(100))
    mention_count: Mapped[int] = mapped_column(Integer, default=1)
    associated_offers: Mapped[Optional[list]] = mapped_column(JSON)
    first_seen: Mapped[Optional[str]] = mapped_column(String(20))
    last_seen: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 14. benchmark_reports
# ────────────────────────────────────────────────────────────
class BenchmarkReport(Base):
    __tablename__ = "benchmark_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    report_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    my_ctr: Mapped[Optional[float]] = mapped_column(Float)
    competitor_estimated_ctr: Mapped[Optional[float]] = mapped_column(Float)
    my_cpc: Mapped[Optional[float]] = mapped_column(Float)
    competitor_estimated_cpc: Mapped[Optional[float]] = mapped_column(Float)
    my_roas: Mapped[Optional[float]] = mapped_column(Float)
    my_creative_score: Mapped[Optional[float]] = mapped_column(Float)
    competitor_creative_score: Mapped[Optional[float]] = mapped_column(Float)
    my_keyword_count: Mapped[Optional[int]] = mapped_column(Integer)
    competitor_keyword_count: Mapped[Optional[int]] = mapped_column(Integer)
    strengths: Mapped[Optional[list]] = mapped_column(JSON)
    weaknesses: Mapped[Optional[list]] = mapped_column(JSON)
    opportunities: Mapped[Optional[list]] = mapped_column(JSON)
    threats: Mapped[Optional[list]] = mapped_column(JSON)
    overall_score: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 15. ai_recommendations
# ────────────────────────────────────────────────────────────
class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(ForeignKey("scrape_sessions.id"))
    recommendation_type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    action_items: Mapped[Optional[list]] = mapped_column(JSON)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    impact_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_actioned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 16. keyword_metrics
# ────────────────────────────────────────────────────────────
class KeywordMetric(Base):
    __tablename__ = "keyword_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    keyword: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    search_volume: Mapped[Optional[int]] = mapped_column(Integer)
    cpc: Mapped[Optional[float]] = mapped_column(Float)
    competition: Mapped[Optional[float]] = mapped_column(Float)
    difficulty: Mapped[Optional[int]] = mapped_column(Integer)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 17. keyword_clusters
# ────────────────────────────────────────────────────────────
class KeywordCluster(Base):
    __tablename__ = "keyword_clusters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    cluster_name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    keywords: Mapped[list] = mapped_column(JSON)  # List of keyword strings
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 18. keyword_trends
# ────────────────────────────────────────────────────────────
class KeywordTrend(Base):
    __tablename__ = "keyword_trends"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    keyword: Mapped[str] = mapped_column(String(255), index=True)
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    search_volume: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('keyword', 'month', 'year', name='uq_keyword_trend'),)


# ────────────────────────────────────────────────────────────
# 19. keyword_gaps
# ────────────────────────────────────────────────────────────
class KeywordGap(Base):
    __tablename__ = "keyword_gaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    keyword: Mapped[str] = mapped_column(String(255))
    my_rank: Mapped[Optional[int]] = mapped_column(Integer)
    competitor_rank: Mapped[Optional[int]] = mapped_column(Integer)
    gap_score: Mapped[float] = mapped_column(Float)
    opportunity_level: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 20. serp_results
# ────────────────────────────────────────────────────────────
class SERPResult(Base):
    __tablename__ = "serp_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    keyword: Mapped[str] = mapped_column(String(255), index=True)
    position: Mapped[int] = mapped_column(Integer)
    url: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(512))
    domain: Mapped[str] = mapped_column(String(255), index=True)
    snippet: Mapped[Optional[str]] = mapped_column(Text)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 21. competitor_keywords
# ────────────────────────────────────────────────────────────
class CompetitorKeyword(Base):
    __tablename__ = "competitor_keywords"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    competitor_id: Mapped[str] = mapped_column(ForeignKey("competitors.id"), index=True)
    keyword: Mapped[str] = mapped_column(String(255), index=True)
    search_volume: Mapped[Optional[int]] = mapped_column(Integer)
    rank: Mapped[Optional[int]] = mapped_column(Integer)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 22. search_intents
# ────────────────────────────────────────────────────────────
class SearchIntent(Base):
    __tablename__ = "search_intents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    keyword: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    intent: Mapped[str] = mapped_column(String(50))  # informational, commercial, etc.
    probability: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# 23. related_keywords
# ────────────────────────────────────────────────────────────
class RelatedKeyword(Base):
    __tablename__ = "related_keywords"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    seed_keyword: Mapped[str] = mapped_column(String(255), index=True)
    related_keyword: Mapped[str] = mapped_column(String(255))
    relevance_score: Mapped[float] = mapped_column(Float)
    search_volume: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
