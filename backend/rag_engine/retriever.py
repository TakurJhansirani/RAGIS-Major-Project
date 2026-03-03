import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class VectorSimilaritySearch:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.sentences = []

    def add_sentences(self, new_sentences):
        embeddings = self.model.encode(new_sentences)
        self.sentences.extend(new_sentences)
        if self.index is None:
            self.index = faiss.IndexFlatL2(embeddings.shape[1])
        self.index.add(np.array(embeddings).astype(np.float32))

    def search(self, query, k=5):
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype(np.float32), k)
        results = [(self.sentences[idx], distances[0][i]) for i, idx in enumerate(indices[0])]
        return results

# Example usage:
# if __name__ == '__main__':
#     search_engine = VectorSimilaritySearch()
#     search_engine.add_sentences(['This is a sample sentence.', 'This is another example.'])
#     results = search_engine.search('sample')
#     print(results)