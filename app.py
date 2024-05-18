

import streamlit as st
from dotenv import load_dotenv
from io import BytesIO
import os
from fpdf import FPDF
import json
from reportlab.lib.pagesizes import letter
from youtube_transcript_api import YouTubeTranscriptApi
import base64
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
load_dotenv()  # Load environment variables
import google.generativeai as genai

st.set_page_config(page_title="YouTube Transcript Converter", page_icon="📝", initial_sidebar_state="expanded")


genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

prompt1 = """You are Yotube video summarizer. .You will be taking the transcript text
# study it generate in in form of a learning content for a student in form of detailed notes in modules for example if transcript is what is Machine learning divide and 
# summarize the transcript text in module 1: Introduction, module 2: types of ml etc. Each module should contain detail content and should be explained in simple
language as being explained to a 10 year old.
# Please provide the above generated content in json format where we have an array named modules and each 
index we have objects with each object has 2 key value pairs title: value and summary: value
. Please provide atleast 5 modules. Depending on content if content and topics are too many give more modules then 5.
 If writing in new line within summary please wrap it up in proper JSON format for newline.
.Please provide the summary of the text given here:  """


prompt2 = """ You are a quiz generator. You will be given the transcript text of the youtube video. You have to make a minimum 5 mcq format quiz. 
For each question give 4 options out of which 1 should be correct. Give the quiz is json format where we have an array named quiz and at each index
we have objects with each objects having 6 key value pairs 1 for question 1 for each 4 options telling the option value and 1 
correct key telling the correct answer value for each question.For each question we have 4 options
and in which only one option will be correct.
 Use proper json format for the response. Please provide the response here: """

class SessionState:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

def extract_transcript_details(youtube_video_url):
    try:
        video_id = youtube_video_url.split("=")[1]

        transcript_text = YouTubeTranscriptApi.get_transcript(video_id)

        transcript = ""
        for i in transcript_text:
            transcript += " " + i["text"]

        return transcript

    except Exception as e:
        raise e


def generate_gemini_summary(transcript_text, prompt1):
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt1 + transcript_text)
    return response.text







def load_json_string(json_string):
    # Remove the initial "JSON" text and starting/ending apostrophes
    json_string = json_string.strip()[3:-3]
    if json_string[:4] == 'JSON':
        json_string = json_string.replace("JSON", "",)
    else:
        json_string = json_string.replace("json", "")
    
    try:
        # Parse the cleaned JSON string into a Python dictionary
        data = json.loads(json_string)
        return data['modules']
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return []

def convert_modules_to_text(modules):
    formatted_text = ""
    for module in modules:
        title = module.get('title', '')
        summary = module.get('summary', '')

        if title:
            formatted_text += f"Module: {title}\n"
        if summary:
            formatted_text += f"Summary:\n{summary}\n\n"

    return formatted_text
 
def create_download_link(val, filename):
    b64 = base64.b64encode(val)  # val looks like b'...'
    return f'<a href="data:application/octet-stream;base64,{b64.decode()}" download="{filename}.pdf">Download file</a>'

import pdfkit



def generate_pdf_and_download(text_modules):
    try:
        # Split text_modules into paragraphs
        paragraphs = text_modules.split('\n\n')

        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        doc_title = Paragraph("Detailed Notes", styles['Title'])
        module_text = [Paragraph(para, styles['Normal']) for para in paragraphs]  # Create Paragraph for each paragraph
        doc.build([doc_title] + module_text)

        # Display download button
        st.download_button(label="Download PDF", data=buffer.getvalue(), file_name="detailed_notes.pdf", mime="application/pdf", key="download_button")
    except Exception as e:
        print(f"Error generating PDF: {e}")

# Streamlit app
def main():
    
    state = SessionState(pdf_generated=False)
    st.title("YouTube Transcript to Detailed Notes Converter")
    youtube_link = st.text_input("Enter YouTube Video Link:")
    

    if youtube_link:
        video_id = youtube_link.split("=")[1]
        st.image(f"http://img.youtube.com/vi/{video_id}/0.jpg", use_column_width=True)

    if st.button("Get Detailed Notes"):
        transcript_text = extract_transcript_details(youtube_link)

        if transcript_text:
            summary = generate_gemini_summary(transcript_text, prompt1)
            # print(summary) 
            modules = load_json_string(summary)
            print(modules)
        
            if modules:
                st.markdown("## Detailed Notes:")
                for i, module in enumerate(modules, start=1):
                    #if st.button(f"Module {i}: {module['title']}"):
                    with st.expander(f"Module {i}: {module['title']}", expanded=False):
                        st.write(module['summary'])

                text_modules = convert_modules_to_text(modules)
                print(text_modules)

                
                generate_pdf_and_download(text_modules)
                    

            else:
                st.write("Failed to load detailed notes.")

                
                      
                                    
            
        

        


if __name__ == "__main__":
    main()


