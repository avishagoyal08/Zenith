import streamlit as st
from dotenv import load_dotenv
import os
import json
from youtube_transcript_api import YouTubeTranscriptApi
# from streamlit_state.session_state import session_state

load_dotenv()  # Load environment variables
import google.generativeai as genai

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))




prompt2 = """ You are a quiz generator. You will be given the transcript text of the youtube video. You have to make a minimum 5 mcq format quiz. 
For each question give 4 options out of which 1 should be correct. Give the quiz is json format where we have an array named quiz and at each index
we have objects with each objects having 6 key value pairs 1 for question 1 for each 4 options telling the option value and 1 
correct key telling the correct answer value for each question.For each question we have 4 options
and in which only one option will be correct.
 Use proper json format for the response. Please provide the response here: """

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




def generate_gemini_quiz(transcript_text,prompt2 ):
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt2 + transcript_text)
    return response.text




def load_json_quiz(json_string):
    # Remove the initial "JSON" text and starting/ending apostrophes
    json_string = json_string.strip()[3:-3]
    if json_string[:4] == 'JSON':
        json_string = json_string.replace("JSON", "",)
    else:
        json_string = json_string.replace("json", "")
    
    try:
        # Parse the cleaned JSON string into a Python dictionary
        data = json.loads(json_string)
        return data['quiz']
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return []





def generate_quiz(quiz_data):
    for i, question_data in enumerate(quiz_data, start=1):
        st.write(f"**Question {i}:** {question_data['question']}")
        for j in range(1, 5):
            option_key = f"option{j}"
            st.write(f"{j}. {question_data[option_key]}")
        selected_option = st.radio(f"Select your answer for question {i}:", [1, 2, 3, 4], key=f"radio_{i}_{question_data['question']}")
        question_data['selected_option'] = selected_option
        st.write("---")
    return quiz_data

def evaluate_quiz(quiz_data):
    score = 0
    st.write("Here are the correct answers:")
    for i, question_data in enumerate(quiz_data, start=1):
        correct_option = question_data['correct']
        selected_option = 'option' + str(question_data['selected_option'])  # Get the value of the selected option
        st.write(f"Question {i}: {question_data['question']}")
        st.write(f"Your answer: {selected_option}")
        st.write(f"Correct answer: {correct_option}")
        st.write("---")
        if selected_option == correct_option:
            score += 1
    st.write(f"You scored {score} out of {len(quiz_data)}")





# Streamlit app
def main():

    if 'quiz_generated' not in st.session_state:
        st.session_state.quiz_generated = False

    st.title("Custom quiz Generator")
    youtube_link = st.text_input("Enter YouTube Video Link:")

    if youtube_link:
        video_id = youtube_link.split("=")[1]
        st.image(f"http://img.youtube.com/vi/{video_id}/0.jpg", use_column_width=True)

    if st.button("Get quiz"):
        transcript_text = extract_transcript_details(youtube_link)

        if transcript_text:
            st.title("MCQ Quiz App")
            st.write("Welcome to the interactive quiz app! Choose an option for each question.")
            quiz_response = generate_gemini_quiz(transcript_text, prompt2)
            #print(quiz_response)
            quiz = load_json_quiz(quiz_response)
            print(quiz)
            #quiz = generate_quiz(quiz)
            st.session_state.quiz_data = quiz
            st.session_state.quiz_generated = True

    if st.session_state.quiz_generated:
        quiz_data = st.session_state.quiz_data
        for i, question_data in enumerate(quiz_data, start=1):
            st.write(f"**Question {i}:** {question_data['question']}")
            for j in range(1, 5):
                option_key = f"option{j}"
                st.write(f"{j}. {question_data[option_key]}")
            selected_option = st.radio(f"Select your answer for question {i}:", [1, 2, 3, 4], key=f"radio_{i}")
            question_data['selected_option'] = selected_option
            st.write("---")
        submitted = st.button("Submit")

        if submitted:
            print(quiz_data)
            evaluate_quiz(quiz_data)
            st.session_state.quiz_generated = False

            
        
            


if __name__ == "__main__":
    main()