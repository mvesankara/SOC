from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.ext.declarative import declarative_base
from .database import metadata # Using the metadata instance from database.py
import datetime
import enum

# Using declarative_base from sqlalchemy.ext.declarative
Base = declarative_base(metadata=metadata)

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

# You can add other models here as the application grows.
# For example, User, Alert, System, etc.
