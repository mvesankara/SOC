from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from .database import metadata # Using the metadata instance from database.py
import datetime
import enum

# Using declarative_base from sqlalchemy.ext.declarative
Base = declarative_base(metadata=metadata)

class SystemStateType(str, enum.Enum):
    ONLINE = "Online"
    WARNING = "Warning"
    OFFLINE = "Offline"

class CriticiteLevel(str, enum.Enum):
    CRITIQUE = "Critique"
    ELEVE = "Élevé"
    MOYEN = "Moyen"
    BAS = "Bas" # Added BAS as it's a common level

class StatutIncident(str, enum.Enum):
    OUVERT = "Ouvert"
    EN_COURS = "En cours"
    RESOLU = "Résolu"
    FERME = "Fermé" # Added FERME as a more definitive final state

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, index=True, nullable=False)
    criticite = Column(SAEnum(CriticiteLevel), nullable=False)
    statut = Column(SAEnum(StatutIncident), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    type = Column(String, index=True, nullable=True) # e.g., Malware, Intrusion
    source = Column(String, nullable=True) # e.g., Endpoint 192.168.1.45

    def __repr__(self):
        return f"<Incident(id={self.id}, title='{self.title}', criticite='{self.criticite}', statut='{self.statut}')>"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True) # Optional for now
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    # created_at = Column(DateTime, default=datetime.datetime.utcnow) # Optional: track user creation time

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', is_active={self.is_active})>"


class System(Base):
    __tablename__ = "systems"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    status = Column(SAEnum(SystemStateType), nullable=False, default=SystemStateType.OFFLINE, index=True)
    cpu_usage_percent = Column(Float, nullable=True)
    memory_usage_percent = Column(Float, nullable=True)
    monitored_endpoints_count = Column(Integer, nullable=True) # Specific to 'Endpoints' system type
    endpoint_issues_count = Column(Integer, nullable=True)   # Specific to 'Endpoints' system type
    last_checked_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def __repr__(self):
        return f"<System(id={self.id}, name='{self.name}', status='{self.status}')>"


class IoCType(str, enum.Enum):
    IP_ADDRESS = "ip_address"
    DOMAIN_NAME = "domain_name"
    FILE_HASH_MD5 = "md5"
    FILE_HASH_SHA1 = "sha1"
    FILE_HASH_SHA256 = "sha256"
    URL = "url"

class IndicatorOfCompromise(Base):
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    value = Column(String, index=True, nullable=False, unique=True) # The IoC value itself
    type = Column(SAEnum(IoCType), nullable=False)
    source = Column(String, nullable=True) # E.g., MISP, AlienVault OTX, Manual
    first_seen = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    malicious_confidence = Column(Integer, nullable=True) # Confidence level (e.g., 0-100)

    def __repr__(self):
        return f"<IndicatorOfCompromise(id={self.id}, type='{self.type}', value='{self.value}')>"


# You can add other models here as the application grows.
# For example, Alert, System, etc.
