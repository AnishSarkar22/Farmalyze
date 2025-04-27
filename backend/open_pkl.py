# sample file to open .pkl files (not required)
import pickle
import os

def open_pkl(file_path='../backend/models/RandomForest.pkl'):
    """
    Opens and reads a .pkl file.

    Args:
        file_path (str): The path to the .pkl file.

    Returns:
        object: The object stored in the .pkl file.
    """
    # Print current working directory
    print(f"Current working directory: {os.getcwd()}")
    print(f"Attempting to open file: {os.path.abspath(file_path)}")
    
    try:
        with open(file_path, 'rb') as file:
            data = pickle.load(file)
            print(f"File opened successfully. Data type: {type(data)}")
            return data
    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None