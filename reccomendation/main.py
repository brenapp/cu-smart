import pandas as pd
import numpy as np
import pickle
import sys

def predict_probability(clothing_level, indoor_temp, indoor_humidity, outdoor_temp, outdoor_humidity, Time, ID):
    filename = './models/model_' + str(ID) +'.sav'
    loaded_model = pickle.load(open(filename, 'rb'))
    if Time >= 12:
        New_time = 2
    if Time < 12:
        New_time = 1
    data = [[clothing_level, indoor_temp, indoor_humidity, outdoor_temp, outdoor_humidity, New_time]]
    X = pd.DataFrame(data, columns = ['clothing_level', 'indoor_temp', 
                                      'indoor_humidity', 'outdoor_temp','outdoor_humidity', 'New Time'])
    probability = loaded_model.predict_proba(X)
    return(probability[0][1])


if __name__ == "__main__":
    num_args = len(sys.argv)
    (_, clothing_level, indoor_temp, indoor_humidity, outdoor_temp, outdoor_humidity, Time, ID) = sys.argv
    
    predict_probability(clothing_level, indoor_temp, indoor_humidity, outdoor_temp, outdoor_humidity, Time, ID)