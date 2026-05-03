from functools import lru_cache
from sentence_transformers import SentenceTransformer
from core.config import Settings

settings = Settings()

MODEL_NAME = settings.MODEL_NAME
INSTRUCTION = "Represent this sentence for searching relevant passages: "


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def embed_query(query: str) -> list[float]:
    model = get_model()
    text = INSTRUCTION + query
    vector = model.encode([text], normalize_embeddings=True)[0]
    return vector.tolist()
