from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Run(Base):
    __tablename__ = "runs"

    run_id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_fingerprint = Column(String, nullable=True)
    face_detected = Column(Integer, default=0)
    search_status = Column(String, nullable=True)
    selected_candidate = Column(String, nullable=True)
    similarity_score = Column(Float, nullable=True)
    block_id = Column(Integer, nullable=True)
    verification_status = Column(String, nullable=True)
    diagnostics_json = Column(Text, nullable=True)

    candidates = relationship("Candidate", back_populates="run")
    blockchain_record = relationship("BlockchainRecord", back_populates="run", uselist=False)


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String, ForeignKey("runs.run_id"), nullable=False)
    source_url = Column(String, nullable=True)
    candidate_image_url = Column(String, nullable=True)
    source_domain = Column(String, nullable=True)
    similarity_score = Column(Float, nullable=True)
    comparison_status = Column(String, nullable=True)
    rank = Column(Integer, nullable=True)

    run = relationship("Run", back_populates="candidates")


class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    record_id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("runs.run_id"), nullable=True)
    block_index = Column(Integer, nullable=False)
    data_hash = Column(String, nullable=False)
    block_hash = Column(String, nullable=False)
    metadata_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String, default="recorded")

    run = relationship("Run", back_populates="blockchain_record")
