from transformers import pipeline

# Initialize the Hugging Face summarization pipeline
summarizer = pipeline('summarization')

def summarize_incident(incident_text):
    summarized = summarizer(incident_text, max_length=130, min_length=30, do_sample=False)
    return summarized[0]['summary_text']
